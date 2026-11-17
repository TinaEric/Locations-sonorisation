import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateReservationDto, LigneMaterielDto } from './dto/create-reservation.dto.js';
import { UpdateReservationDto } from './dto/update-reservation.dto.js';
import { DataSource, EntityManager, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LigneLocation, TypeLigne } from '../ligne-location/entities/ligne-location.entity.js';
import { Utilisateur } from '../../compteUser/utilisateur/entities/utilisateur.entity.js';
import { Materiel } from '../../Catalogue/materiel/entities/materiel.entity.js';
import {
  ModeRetrait,
  StatutItem,
  StatutLocation,
} from './enum/enum-location.js';
import { Item } from '../../Catalogue/item/entities/item.entity.js';
import { Reservation } from './entities/reservation.entity.js';
import { LigneItemsDisponibles } from './dto/ligne-items-disponible.dto.js';
import { CreateMouvementDto } from '../mouvement/dto/create-mouvement.dto.js';
import { Mouvement } from '../mouvement/entities/mouvement.entity.js';
import { CreateMouvementsLigneDto } from '../mouvement/dto/mouvement-item.dto.js';
import { Categorie } from '../../Catalogue/categorie/entities/categorie.entity.js';
import { Pack, StatutPack } from '../pack/entities/pack.entity.js';
import { DisponibiliteService } from '../Disponibilite/disponibilite.service.js';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private locRepos: Repository<Reservation>,
    private readonly dataSource: DataSource,
    private readonly disponibilite: DisponibiliteService,
  ) {}

  async create(dto: CreateReservationDto): Promise<Reservation> {
    if (new Date(dto.dateFinPrevue) < new Date(dto.dateDebutPrevue)) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début',
      );
    }

    const materielIds = dto.ligneLocations.map((l) => l.codeMateriel);
    if (new Set(materielIds).size !== materielIds.length) {
      throw new BadRequestException(
        "Un même matériel ne peut apparaître qu'une seule fois",
      );
    }
    const numReservationAuto = await this.IdReservationSuivant(dto.idUser);

    return this.dataSource.transaction(async (manager) => {
      const utilisateur = await manager.findOne(Utilisateur, {
        where: { idUser: dto.idUser, isDelete: 'non' },
      });
      if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');

      const materiels = await manager.find(Materiel, {
        where: { CodeMateriel: In(materielIds), isDelete: 'non' },
      });
      const materielParId = new Map(materiels.map((m) => [m.CodeMateriel, m]));

      const reservation = new Reservation();
      reservation.numReservation = numReservationAuto;
      reservation.dateDebutPrevue = new Date(dto.dateDebutPrevue);
      reservation.dateFinPrevue = new Date(dto.dateFinPrevue);
      reservation.lieuEvenement = dto.lieuEvenement ?? '';
      reservation.remarques = dto.remarques ?? '';
      reservation.modeRetrait = dto.modeRetrait ?? ModeRetrait.SUR_PLACE;
      reservation.fraisLivraison =
        dto.modeRetrait === ModeRetrait.LIVRAISON
          ? (dto.fraisLivraison ?? 0)
          : 0;
      reservation.statutLocation = StatutLocation.EN_ATTENTE;
      reservation.utilisateur = utilisateur;
      reservation.isDelete = 'non';

      reservation.ligneLocations = [];
      for (const l of dto.ligneLocations) {
        const materiel = materielParId.get(l.codeMateriel);
        if (!materiel)
          throw new NotFoundException(`Matériel ${l.codeMateriel} introuvable`);

        await this.verifierDispo(
          manager,
          materiel.CodeMateriel,
          l.quantite,
          dto.dateDebutPrevue,
          dto.dateFinPrevue,
        );

        reservation.ligneLocations.push(
          manager.create(LigneLocation, {
            quantite: l.quantite,
            tarifApplique: materiel.prixLocation,
            materiel,
          }),
        );
      }
      reservation.montantTotal = reservation.calculMontantTotal();

      await manager.save(reservation);

      return manager.findOneOrFail(Reservation, {
        where: { numReservation: reservation.numReservation, isDelete: 'non' },
        relations: { ligneLocations: { materiel: true } },
      });
    });
  }

  async creerMouvementsLigne(
    numReservation: string,
    ligneId: number,
    dto: CreateMouvementsLigneDto,
  ): Promise<Mouvement[]> {
    return this.dataSource.transaction(async (manager) => {
      // Réservation non supprimée
      const reservation = await manager.findOne(Reservation, {
        where: { numReservation, isDelete: 'non' },
        relations: { ligneLocations: { materiel: true } },
      });
      if (!reservation)
        throw new NotFoundException(`Réservation '${numReservation}' introuvable`);

      if (
        reservation.statutLocation !== StatutLocation.CONFIRMEE &&
        reservation.statutLocation !== StatutLocation.EN_COURS
      ) {
        throw new BadRequestException(
          "Le retrait n'est possible que pour une réservation confirmée ou en cours",
        );
      }

      // La ligne appartient bien à cette réservation
      const ligne = reservation.ligneLocations.find((l) => l.idLigne === ligneId);
      if (!ligne)
        throw new NotFoundException(
          `Ligne '${ligneId}' introuvable dans cette réservation`,
        );

      // Nombre d'items : on ne dépasse pas la quantité de la ligne
      const dejaRemis = await manager.count(Mouvement, {
        where: { ligneLocation: { idLigne: ligneId } },
      });
      if (dejaRemis + dto.items.length > ligne.quantite) {
        throw new BadRequestException(
          `Ligne ${ligneId} : quantité ${ligne.quantite}, ${dejaRemis} déjà remis, ` +
            `${dto.items.length} demandé(s)`,
        );
      }

      // Pas de doublon dans la requête
      const series = dto.items.map((i) => i.numeroSerie);
      if (new Set(series).size !== series.length) {
        throw new BadRequestException('Un même item apparaît plusieurs fois');
      }
      const dateDepart = dto.dateDepart ? new Date(dto.dateDepart) : new Date();

      // Création des mouvements + passage des items à LOUE
      const mouvements: Mouvement[] = [];
      for (const it of dto.items) {
        const item = await manager.findOne(Item, {
          where: { numeroSerie: it.numeroSerie, isDelete: 'non' },
          relations: { materiel: true },
        });
        if (!item)
          throw new NotFoundException(`Item ${it.numeroSerie} introuvable`);

        if (!ligne.materiel || item.materiel.CodeMateriel !== ligne.materiel.CodeMateriel) {
          throw new BadRequestException(
            `L'item ${it.numeroSerie} ne correspond pas au matériel ${ligne.materiel?.CodeMateriel}`,
          );
        }

        // Mise à jour atomique : échoue si l'item n'est plus disponible ou supprimé
        const maj = await manager.update(
          Item,
          {
            numeroSerie: it.numeroSerie,
            statutItem: StatutItem.DISPONIBLE,
            isDelete: 'non',
          },
          { statutItem: StatutItem.LOUE },
        );
        if (maj.affected !== 1) {
          throw new BadRequestException(`L'item ${it.numeroSerie} n'est pas disponible`);
        }

        const mouvement = new Mouvement();
        mouvement.dateDepart = dateDepart;
        mouvement.etatDepart = it.etatDepart ?? item.etatItem;
        mouvement.dateRetour = null;
        mouvement.etatRetour = null;
        mouvement.accessoire = it.accessoire ?? null;
        mouvement.ligneLocation = ligne;
        mouvement.item = item;
        mouvements.push(await manager.save(mouvement));
      }

      // Si toutes les lignes sont complètes, la réservation passe EN_COURS
      if (reservation.statutLocation === StatutLocation.CONFIRMEE) {
        let toutesCompletes = true;
        for (const l of reservation.ligneLocations) {
          const nb = await manager.count(Mouvement, {
            where: { ligneLocation: { idLigne: l.idLigne } },
          });
          if (nb < l.quantite) {
            toutesCompletes = false;
            break;
          }
        }
        if (toutesCompletes) {
          reservation.statutLocation = StatutLocation.EN_COURS;
          await manager.save(reservation);
        }
      }

      return mouvements;
    });
  }

  private async verifierDispo(
    manager: EntityManager,
    materielId: string,
    quantite: number,
    debut: string,
    fin: string,
  ): Promise<void> {
    // Items physiques non supprimés uniquement
    const totalItems = await manager.count(Item, {
      where: { materiel: { CodeMateriel: materielId }, isDelete: 'non' },
    });

    const result = await manager
      .createQueryBuilder(LigneLocation, 'll')
      .innerJoin('ll.reservation', 'loc')
      .innerJoin('ll.materiel', 'm')
      .select('COALESCE(SUM(ll.quantite), 0)', 'reservee')
      .where('m.CodeMateriel = :materielId', { materielId })
      .andWhere('loc.statutLocation NOT IN (:...exclus)', {
        exclus: [StatutLocation.ANNULEE, StatutLocation.TERMINEE],
      })
      .andWhere('loc.isDelete = :isDelete', { isDelete: 'non' })
      .andWhere('loc.dateDebutPrevue <= :fin AND loc.dateFinPrevue >= :debut', {
        debut,
        fin,
      })
      .getRawOne<{ reservee: string }>();

    const reservee = result?.reservee || '0';

    const disponible = totalItems - Number(reservee);
    if (quantite > disponible) {
      throw new BadRequestException(
        `Stock insuffisant pour le matériel ${materielId} (disponible : ${Math.max(disponible, 0)})`,
      );
    }
  }

  async materielsDisponibles(debut: string, fin: string) {
    if (new Date(fin) < new Date(debut)) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début',
      );
    }

    const manager = this.dataSource.manager;

    // Nombre d'items physiques par matériel (non supprimés)
    const totaux = await manager
      .createQueryBuilder(Item, 'i')
      .innerJoin('i.materiel', 'm')
      .select('m.CodeMateriel', 'codeMateriel')
      .addSelect('COUNT(*)', 'total')
      .where('i.isDelete = :isDelete', { isDelete: 'non' })
      .andWhere('m.isDelete = :isDelete', { isDelete: 'non' })
      .groupBy('m.CodeMateriel')
      .getRawMany<{ codeMateriel: string; total: string }>();

    // Quantités déjà réservées sur la période (réservations non supprimées qui chevauchent)
    const reservees = await manager
      .createQueryBuilder(LigneLocation, 'll')
      .innerJoin('ll.reservation', 'res')
      .innerJoin('ll.materiel', 'm')
      .select('m.CodeMateriel', 'codeMateriel')
      .addSelect('COALESCE(SUM(ll.quantite), 0)', 'reservee')
      .where('res.statutLocation NOT IN (:...exclus)', {
        exclus: [StatutLocation.ANNULEE, StatutLocation.TERMINEE],
      })
      .andWhere('res.isDelete = :isDelete', { isDelete: 'non' })
      .andWhere('m.isDelete = :isDelete', { isDelete: 'non' })
      .andWhere('res.dateDebutPrevue <= :fin AND res.dateFinPrevue >= :debut', {
        debut,
        fin,
      })
      .groupBy('m.CodeMateriel')
      .getRawMany<{ codeMateriel: string; reservee: string }>();

    const totalParCode = new Map(
      totaux.map((t) => [t.codeMateriel, Number(t.total)]),
    );
    const reserveeParCode = new Map(
      reservees.map((r) => [r.codeMateriel, Number(r.reservee)]),
    );

    // Catégories actives avec matériels non supprimés
    const categories = await manager.find(Categorie, {
      relations: { materiels: true },
    });

    const liste = categories
      .map((cat) => {
        const materielsDisponibles = cat.materiels
          .filter((m) => m.isDelete === 'non')
          .map((m) => {
            const quantiteTotale = totalParCode.get(m.CodeMateriel) ?? 0;
            const quantiteReservee = reserveeParCode.get(m.CodeMateriel) ?? 0;
            return {
              ...m,
              quantiteTotale,
              quantiteReservee,
              quantiteDisponible: Math.max(quantiteTotale - quantiteReservee, 0),
            };
          })
          .filter((m) => m.quantiteDisponible > 0);

        return { ...cat, materiels: materielsDisponibles };
      })
      .filter(
        (cat) => cat.statutCategorie === 'ACTIF' && cat.materiels.length > 0,
      );

    return liste;
  }

  async itemsDisponiblesParLigne(
    numReservation: string,
  ): Promise<LigneItemsDisponibles[]> {
    // Réservation non supprimée
    const reservation = await this.locRepos.findOne({
      where: { numReservation, isDelete: 'non' },
      relations: { ligneLocations: { materiel: true } },
    });
    if (!reservation) {
      throw new NotFoundException(`Réservation ${numReservation} introuvable`);
    }

    const codes = reservation.ligneLocations.map(
      (l) => l.materiel?.CodeMateriel,
    );
    if (codes.length === 0) return [];

    // Items disponibles non supprimés de ces matériels
    const items = await this.dataSource.manager.find(Item, {
      where: {
        materiel: { CodeMateriel: In(codes), isDelete: 'non' },
        statutItem: StatutItem.DISPONIBLE,
        isDelete: 'non',
      },
      relations: { materiel: true },
      order: { numeroSerie: 'ASC' },
    });

    // Regroupement par code matériel
    const itemsParCode = new Map<string, Item[]>();
    for (const item of items) {
      const code = item.materiel.CodeMateriel;
      const liste = itemsParCode.get(code) ?? [];
      liste.push(item);
      itemsParCode.set(code, liste);
    }

    // Une entrée par ligne de location
    return reservation.ligneLocations
      .filter((ligne) => ligne.materiel !== null)
      .map((ligne) => {
        const itemsDisponibles =
          itemsParCode.get(ligne.materiel!.CodeMateriel) ?? [];
        return {
          ligneId: ligne.idLigne,
          quantite: ligne.quantite,
          materiel: ligne.materiel!,
          itemsDisponibles,
          nombreDisponible: itemsDisponibles.length,
          suffisant: itemsDisponibles.length >= ligne.quantite,
        };
      });
  }

  async findAll(): Promise<Reservation[]> {
    return await this.locRepos.find({
      where: { isDelete: 'non' },
      relations: { utilisateur: true, ligneLocations: true, paiements: true },
    });
  }

  async findOne(numReservation: string): Promise<Reservation> {
    const reservation = await this.locRepos.findOne({
      where: { numReservation, isDelete: 'non' },
      relations: {
        utilisateur: true,
        ligneLocations: { materiel: true },
        paiements: true,
      },
    });
    if (!reservation)
      throw new NotFoundException(`Réservation ${numReservation} introuvable`);
    return reservation;
  }

  async update(
    numReservation: string,
    dto: UpdateReservationDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(numReservation);
    if (!reservation) {
      throw new NotFoundException(`Réservation '${numReservation}' introuvable`);
    }
    const { idUser, ...rest } = dto;

    this.locRepos.merge(reservation, rest);
    if (idUser) {
      reservation.utilisateur = { idUser } as any;
    }
    return await this.locRepos.save(reservation);
  }

  /** Soft delete : on ne supprime pas physiquement la réservation. */
  async remove(numReservation: string): Promise<void> {
    const reservation = await this.findOne(numReservation);

    reservation.isDelete = 'oui';
    await this.locRepos.save(reservation);
  }

  async IdReservationSuivant(idUser: string) {
    const data = await this.locRepos
      .createQueryBuilder('reservation')
      // On tient compte de toutes les réservations (même supprimées) pour éviter les collisions
      .orderBy('reservation.numReservation', 'DESC')
      .getOne();

    if (!data) {
      return idUser + '-LOC0001';
    }
    const match = data.numReservation.match(/\d+$/);
    const val = (match ? parseInt(match[0], 10) : 0) + 1;
    const nextId = String(val).padStart(4, '0');
    return idUser + '-LOC' + nextId;
  }

  async creerReservation(dto: CreateReservationDto) {
    const debut = new Date(dto.dateDebutPrevue);
    const fin = new Date(dto.dateFinPrevue);
    if (fin < debut)
      throw new BadRequestException('dateFinPrevue doit être après dateDebutPrevue');

    const numReservation = await this.dataSource.transaction(async (manager) => {
      // Utilisateur non supprimé
      const utilisateur = await manager.findOne(Utilisateur, {
        where: { idUser: dto.idUser, isDelete: 'non' },
      });
      if (!utilisateur)
        throw new NotFoundException(`Utilisateur ${dto.idUser} introuvable`);

      const { lignes, besoins } = await this.preparerLignes(manager, dto);
      await this.verifierDisponibilite(
        manager,
        besoins,
        dto.dateDebutPrevue,
        dto.dateFinPrevue,
      );

      const reservation = new Reservation();
      reservation.numReservation = await this.IdReservationSuivant(dto.idUser);
      reservation.dateDebutPrevue = dto.dateDebutPrevue as unknown as Date;
      reservation.dateFinPrevue = dto.dateFinPrevue as unknown as Date;
      reservation.lieuEvenement = dto.lieuEvenement as string;
      reservation.remarques = dto.remarques as string;
      if (dto.modeRetrait) reservation.modeRetrait = dto.modeRetrait;
      reservation.fraisLivraison = dto.fraisLivraison ?? 0;
      reservation.statutLocation = StatutLocation.EN_ATTENTE;
      reservation.utilisateur = utilisateur;
      reservation.ligneLocations = lignes;
      reservation.montantTotal = reservation.calculMontantTotal();
      reservation.isDelete = 'non';

      await manager.save(reservation);
      return reservation.numReservation;
    });

    return this.dataSource.getRepository(Reservation).findOne({
      where: { numReservation, isDelete: 'non' },
      relations: { utilisateur: true, ligneLocations: { materiel: true, pack: true } },
    });
  }

  /** Construit les lignes selon actionLocataire et les besoins en matériel (pour le stock). */
  private async preparerLignes(m: EntityManager, dto: CreateReservationDto) {
    const lignes: LigneLocation[] = [];
    const besoins = new Map<string, number>();
    const besoin = (code: string, q: number) =>
      besoins.set(code, (besoins.get(code) ?? 0) + q);
    const nouvelle = (data: object) => Object.assign(new LigneLocation(), data);

    // Cas "materiel" : lignes MATERIEL, sans pack
    if (dto.actionLocataire === 'materiel') {
      const demandes = this.fusionner(dto.materiels ?? []);
      const materiels = await this.chargerMateriels(m, demandes);
      for (const [code, quantite] of demandes) {
        const mat = materiels.get(code)!;
        lignes.push(
          nouvelle({
            quantite,
            typeLigne: TypeLigne.MATERIEL,
            materiel: mat,
            pack: null,
            tarifApplique: Number(mat.prixLocation),
          }),
        );
        besoin(code, quantite);
      }
      return { lignes, besoins };
    }

    const pack = await this.chargerPack(m, dto.codePack!);

    // Cas "pack" : pack non modifié, une seule ligne qui pointe vers le pack
    if (dto.actionLocataire === 'pack') {
      const quantite = dto.quantitePack ?? 1;
      lignes.push(
        nouvelle({
          quantite,
          typeLigne: TypeLigne.PACK,
          pack,
          materiel: null,
          tarifApplique: Number(pack.tarifJournalier),
        }),
      );
      // On ne compte que les composants dont le matériel n'est pas supprimé
      for (const c of pack.composants) {
        if (c.materiel?.isDelete === 'non') {
          besoin(c.materiel.CodeMateriel, c.quantite * quantite);
        }
      }
      return { lignes, besoins };
    }

    // Cas "personnalise" : une ligne par matériel final, pack gardé pour la traçabilité
    const demandes = this.fusionner(dto.materiels ?? []);
    const materiels = await this.chargerMateriels(m, demandes);
    for (const [code, quantite] of demandes) {
      const mat = materiels.get(code)!;
      lignes.push(
        nouvelle({
          quantite,
          typeLigne: TypeLigne.PACK,
          pack,
          materiel: mat,
          tarifApplique: Number(mat.prixLocation),
        }),
      );
      besoin(code, quantite);
    }
    return { lignes, besoins };
  }

  private fusionner(liste: LigneMaterielDto[]) {
    const map = new Map<string, number>();
    for (const { codeMateriel, quantite } of liste) {
      map.set(codeMateriel, (map.get(codeMateriel) ?? 0) + quantite);
    }
    return map;
  }

  private async chargerMateriels(
    m: EntityManager,
    demandes: Map<string, number>,
  ) {
    const codes = [...demandes.keys()];
    const trouves = await m.find(Materiel, {
      where: { CodeMateriel: In(codes), isDelete: 'non' },
    });
    const manquants = codes.filter(
      (c) => !trouves.some((t) => t.CodeMateriel === c),
    );
    if (manquants.length)
      throw new NotFoundException(`Matériel introuvable : ${manquants.join(', ')}`);
    return new Map(trouves.map((t) => [t.CodeMateriel, t]));
  }

  private async chargerPack(m: EntityManager, codePack: string) {
    const pack = await m.findOne(Pack, {
      where: { codePack, isDelete: 'non' },
    });
    if (!pack) throw new NotFoundException(`Pack ${codePack} introuvable`);
    if (pack.statutPack !== StatutPack.ACTIF)
      throw new BadRequestException(`Pack ${codePack} indisponible`);
    return pack;
  }

  private async verifierDisponibilite(
    m: EntityManager,
    besoins: Map<string, number>,
    debut: string,
    fin: string,
  ) {
    const dispo = await this.disponibilite.quantitesDisponibles(
      [...besoins.keys()],
      debut,
      fin,
      m,
    );
    const erreurs: string[] = [];
    for (const [code, voulu] of besoins) {
      const libre = dispo.get(code) ?? 0;
      if (voulu > libre)
        erreurs.push(`${code} : ${voulu} demandé(s), ${libre} disponible(s)`);
    }
    if (erreurs.length) throw new BadRequestException(erreurs);
  }
}