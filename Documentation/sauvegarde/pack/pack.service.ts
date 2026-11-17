import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreatePackDto } from './dto/create-pack.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdatePackDto } from './dto/update-pack.dto.js';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Pack, StatutPack } from './entities/pack.entity.js';
import { ComposantPack } from '../composant-pack/entities/composant-pack.entity.js';
import { Materiel } from '../../Catalogue/materiel/entities/materiel.entity.js';
import { PacksDisponiblesDto } from './dto/packs-disponibles.dto.js';
import { DisponibiliteService } from '../Disponibilite/disponibilite.service.js';
import { CreateComposantPackDto } from './dto/pack-composant.dto.js';
import { LigneLocation } from '../ligne-location/entities/ligne-location.entity.js';
import { Item } from '../../Catalogue/item/entities/item.entity.js';
import { StatutLocation } from '../reservation/enum/enum-location.js';

@Injectable()
export class PackService {

  constructor(
    @InjectRepository(Pack)
    private  packRepos: Repository<Pack>,

    @InjectRepository(Materiel)
    private readonly materielRepository: Repository<Materiel>,

    @InjectRepository(ComposantPack)                      
    private readonly composantRepository: Repository<ComposantPack>,

    private readonly dataSource: DataSource,
    private readonly disponibilite: DisponibiliteService,
  ){}

    async createPackInfo(dto: CreatePackDto): Promise<Pack> {
      const pack = this.packRepos.create({
        ...dto,
        isDelete: "non",
        codePack: await this.genererCodePack()
      });
      return await this.packRepos.save(pack);
    }

  async create(dto: CreatePackDto) {
    // un matériel ne peut apparaître qu'une fois par pack : on additionne les doublons
    const demandes = new Map<string, number>();
    for (const c of dto.composants) {
      demandes.set(c.codeMateriel, (demandes.get(c.codeMateriel) ?? 0) + c.quantite);
    }

    const codePack = await this.dataSource.transaction(async (manager) => {
      const materiels = await manager.find(Materiel, {
        where: { CodeMateriel: In([...demandes.keys()]), isDelete: "non" },
      });
      const manquants = [...demandes.keys()].filter(
        (code) => !materiels.some((m) => m.CodeMateriel === code),
      );
      if (manquants.length) throw new NotFoundException(`Matériel introuvable : ${manquants.join(', ')}`);

      const pack = new Pack();
      pack.codePack = await this.genererCodePack(manager);
      pack.libelle = dto.libelle;
      pack.isDelete = "non";
      pack.typesEvenement = dto.typesEvenement ?? null;
      pack.description = dto.description as string;
      pack.imageUrl = dto.imageUrl as string;

      pack.composants = materiels.map((materiel) =>
        Object.assign(new ComposantPack(), { materiel, quantite: demandes.get(materiel.CodeMateriel)! }),
      );

      const tarifComposants = pack.calculerTarifComposants();
      const cautionComposants = pack.composants.reduce(
        (t, c) => t + Number(c.materiel.prixCaution) * c.quantite, 0,
      );
      pack.tarifJournalier =
        dto.tarifJournalier ??
        Math.round(tarifComposants * 100) / 100;
      pack.prixCaution = dto.prixCaution ?? cautionComposants;

      if (pack.tarifJournalier > tarifComposants) {
        throw new BadRequestException(
          `Le tarif du pack (${pack.tarifJournalier}) dépasse la somme des composants (${tarifComposants})`,
        );
      }

      await manager.save(pack); // composants insérés par cascade
      return pack.codePack;
    });

    return this.dataSource.getRepository(Pack).findOneByOrFail({ codePack });
  }

  async addComposantsToPack(
    codePack: string,
    listeMat: CreateComposantPackDto[],
  ): Promise<ComposantPack[]> {
    const pack = await this.packRepos.findOne({ where: { codePack , isDelete: "non"} });
    if (!pack) {
      throw new NotFoundException(`Pack "${codePack}" introuvable.`);
    }

    if (!listeMat || listeMat.length === 0) {
      throw new BadRequestException('Au moins un composant est requis.');
    }
    
    const codes = [...new Set(
      listeMat
        .map((c) => c.codeMateriel?.trim())
        .filter((c): c is string => !!c),
    )];
    
    if (codes.length !== listeMat.length) {
      throw new BadRequestException(
        'Chaque composant doit avoir un codeMateriel non vide.',
      );
    }
    
    const materiels = await this.materielRepository.find({
      where: { CodeMateriel: In(codes), isDelete: "non"  },
      select: {CodeMateriel: true},
    });
    
    const existantsSet = new Set(materiels.map((m) => m.CodeMateriel));
    const manquants = codes.filter((c) => !existantsSet.has(c));
    if (manquants.length > 0) {
      throw new BadRequestException(
        `Matériel(s) introuvable(s) : ${manquants.join(', ')}`,
      );
    }

    const dejaPresents = await this.composantRepository.find({
      where: {
        pack: { codePack },
        materiel: { CodeMateriel: In(codes) },
      },
      relations: {materiel: true},
    });
    if (dejaPresents.length > 0) {
      const details = dejaPresents
        .map((c) => c.materiel.CodeMateriel)
        .join(', ');
      throw new ConflictException(
        `Matériel(s) déjà présent(s) dans le pack : ${details}`,
      );
    }

    const items = listeMat.map((c) =>
      this.composantRepository.create({
        pack : {codePack: pack.codePack},
        materiel: { CodeMateriel: c.codeMateriel },
        quantite: c.quantite
      }),
    );

    return this.composantRepository.save(items);
  }

  async genererCodePack(manager?: EntityManager): Promise<string> {
    const repo = manager ? manager.getRepository(Pack) : this.packRepos;
    const type = 'PACK';
    const padding = 4;
  
    const rows = await repo
      .createQueryBuilder('pack')
      .select('pack.codePack', 'codePack')  
      .where('pack.codePack LIKE :pattern', { pattern: `${type}%` })
      .getRawMany<{ codePack: string }>();
  
    const regex = new RegExp(`^${type}(\\d+)$`);
  
    const max = rows.reduce((m, r) => {
      const match = r.codePack?.match(regex);   
      if (!match) return m;
      const n = parseInt(match[1], 10);
      return Number.isNaN(n) ? m : Math.max(m, n);
    }, 0);
  
    return `${type}${String(max + 1).padStart(padding, '0')}`;
  }

    async findAll(): Promise<Pack[]> {
      return await this.packRepos.find({ 
        where: {isDelete: "non" },
        relations: { composants: { materiel: true} } });
    }
  
    async findOne(codePack: string): Promise<Pack> {
      const categorie = await this.packRepos.findOne({
        where: { codePack : codePack, isDelete: "non"  },
        relations: { composants: {materiel: true} } 
      });
      if (!categorie) throw new NotFoundException(`Catégorie '${codePack}' introuvable`);
      return categorie;
    }
  
    async update(codePack: string, dto: UpdatePackDto): Promise<Pack> {
      const pack = await this.packRepos.findOneBy({codePack: codePack});
      if (!pack) {
              throw new NotFoundException(`Pack avec l'ID ${codePack} n'existe pas.`);
            }
      this.packRepos.merge(pack, dto);
      return await this.packRepos.save(pack);
    }

    async remove(codePack: string): Promise<{ message: string }> {
      const pack = await this.packRepos.findOne({ where: { codePack }, relations: { composants: true } });
      if (!pack) {
        throw new NotFoundException(`Pack "${codePack}" introuvable.`);
      }
  
      const ligneLocationRepo = this.dataSource.getRepository(LigneLocation);
      const usage = await ligneLocationRepo.count({ where: { pack: { codePack } } });

      if (usage > 0) {
        pack.setIsdelete()
        await this.packRepos.save(pack);
        return {
          message: `Pack "${codePack}" est déplacé dans le corbeille`
        };
      }
  
      await this.dataSource.transaction(async (manager) => {
        await manager.delete(ComposantPack, { pack: { codePack } });
        await manager.delete(Pack, { codePack });
      });
  
      return { message: `Pack "${codePack}" supprimé avec succès.` };
    }
  

   async getTypeEvenement(): Promise<string[]> {
    const rows = await this.packRepos
      .createQueryBuilder('pack')
      .select('DISTINCT pack.typesEvenement', 'typePack')
      .where("pack.typesEvenement IS NOT NULL")
      .andWhere('pack.isDelete  = :isDelete', { isDelete: 'non' })
      .andWhere('pack.statutPack  = :statut', { statut: 'actif' })
      .getRawMany();

    return rows.map((r) => r.typePack);
    }

    async disponibles(dto: PacksDisponiblesDto) {
      if (dto.dateFin < dto.dateDebut) {
        throw new BadRequestException('dateFin doit être égale ou postérieure à dateDebut');
      }

      let packs = await this.dataSource.getRepository(Pack).find({
        where: { statutPack: StatutPack.ACTIF, isDelete: "non" },
      });

      // filtre par type d'événement : un pack sans type convient à tous
      if (dto.typeEvenement) {
        packs = packs.filter(
          (p) => !p.typesEvenement?.length || p.typesEvenement.includes(dto.typeEvenement!),
        );
      }

      const codes = [...new Set(packs.flatMap((p) => p.composants.map((c) => c.materiel.CodeMateriel)))];
      const dispo = await this.disponibilite.quantitesDisponibles(codes, dto.dateDebut, dto.dateFin);

      return packs
        .map((pack) => {
          const composants = pack.composants.map((c) => ({
            ...c,
            disponible: dispo.get(c.materiel.CodeMateriel) ?? 0,
          }));
          // nombre de packs identiques possibles = min(floor(libre ÷ quantité requise))
          const quantiteDisponible = composants.length
            ? Math.min(...composants.map((c) => Math.floor(c.disponible / c.quantite)))
            : 0;
          return { ...pack, composants, quantiteDisponible };
        })
        .filter((p) => p.quantiteDisponible > 0);
    }

    async findOnePublicAvecStock(
      codePack: string,
      dateDebut: string,
      dateFin: string,
    ): Promise<any> {
      if (new Date(dateFin) < new Date(dateDebut)) {
        throw new BadRequestException(
          'La date de fin doit être postérieure à la date de début.',
        );
      }

      // 1. Charger le pack avec ses composants et leurs matériels
      const pack = await this.packRepos.findOne({
        where: { codePack, isDelete: 'non' },
        relations: {
          composants: { materiel: true },
        },
      });
      if (!pack) {
        throw new NotFoundException(`Pack '${codePack}' introuvable.`);
      }

      // 2. Récupérer les codes matériels uniques
      const codesMateriels = [
        ...new Set(
          (pack.composants ?? [])
            .map((c) => c.materiel?.CodeMateriel)
            .filter(Boolean),
        ),
      ] as string[];

      // 3. Si aucun matériel, on renvoie le pack tel quel
      if (!codesMateriels.length) {
        return {
          ...pack,
          composants: (pack.composants ?? []).map((c) => ({
            ...c,
            materiel: c.materiel
              ? { ...c.materiel, quantiteTotale: 0, quantiteReservee: 0, quantiteDisponible: 0 }
              : null,
          })),
        };
      }

      // 4. Calculer les stocks via le même service que pour le catalogue
      const stocks = await this.calculerStocksMateriels(
        this.packRepos.manager,
        codesMateriels,
        dateDebut,
        dateFin,
      );

      // 5. Enrichir chaque composant
      const composantsEnrichis = (pack.composants ?? []).map((c) => {
        const code = c.materiel?.CodeMateriel;
        const stock = code ? stocks.get(code) : undefined;
        return {
          ...c,
          materiel: c.materiel
            ? {
                ...c.materiel,
                quantiteTotale: stock?.totale ?? 0,
                quantiteReservee: stock?.reservee ?? 0,
                quantiteDisponible: stock?.disponible ?? 0,
              }
            : null,
        };
      });

      return {
        ...pack,
        composants: composantsEnrichis,
      };
    }

    private async calculerStocksMateriels(
      manager: EntityManager,
      codes: string[],
      dateDebut: string,
      dateFin: string,
    ): Promise<
      Map<string, { totale: number; reservee: number; disponible: number }>
    > {
      const result = new Map<
        string,
        { totale: number; reservee: number; disponible: number }
      >();
      if (!codes.length) return result;

      // Totaux par matériel
      const totauxRaw = await manager
        .createQueryBuilder(Item, 'i')
        .innerJoin('i.materiel', 'm')
        .select('m.CodeMateriel', 'codeMateriel')
        .addSelect('COUNT(*)', 'total')
        .where('i.isDelete = :isDelete', { isDelete: 'non' })
        .andWhere('m.isDelete = :isDelete', { isDelete: 'non' })
        .andWhere('m.CodeMateriel IN (:...codes)', { codes })
        .andWhere('i.statutItem IN (:...ok)', {
          ok: ['DISPONIBLE', 'LOUE'],
        })
        .groupBy('m.CodeMateriel')
        .getRawMany<{ codeMateriel: string; total: string }>();

      // Quantités réservées sur la période (réservations actives uniquement)
      const reserveesRaw = await manager
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
        .andWhere('m.CodeMateriel IN (:...codes)', { codes })
        .andWhere('res.dateDebutPrevue <= :fin AND res.dateFinPrevue >= :debut', {
          debut: dateDebut,
          fin: dateFin,
        })
        .groupBy('m.CodeMateriel')
        .getRawMany<{ codeMateriel: string; reservee: string }>();

      const totalMap = new Map(
        totauxRaw.map((t) => [t.codeMateriel, Number(t.total)]),
      );
      const reserveMap = new Map(
        reserveesRaw.map((r) => [r.codeMateriel, Number(r.reservee)]),
      );

      for (const code of codes) {
        const totale = totalMap.get(code) ?? 0;
        const reservee = reserveMap.get(code) ?? 0;
        result.set(code, {
          totale,
          reservee,
          disponible: Math.max(totale - reservee, 0),
        });
      }
      return result;
    }
}
