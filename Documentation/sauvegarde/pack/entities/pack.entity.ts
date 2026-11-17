import {
    Entity,
    PrimaryColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
import { ComposantPack } from '../../composant-pack/entities/composant-pack.entity.js';
import { LigneLocation } from '../../ligne-location/entities/ligne-location.entity.js';
import { Exclude } from 'class-transformer';

  export enum StatutPack {
    ACTIF = 'actif',
    INACTIF = 'inactif',
    ARCHIVE = 'archive',
  }
  
  @Entity('pack')
  export class Pack {

    @PrimaryColumn({ name: 'code_pack', length: 10, unique: true })
    codePack: string;
  
    @Column({ length: 100 })
    libelle: string;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    @Column({ name: 'types_evenement', length: 30, nullable: true })
    typesEvenement: string;

    @Column({
      name: 'tarif_journalier',
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0,
    })
    tarifJournalier: number;
  
    @Column({
      name: 'prix_caution',
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0,
    })
    prixCaution: number;

    @Column({name: 'statut_pack',length: 8, nullable: false })
    statutPack: string;
  
    @Column({ name: 'image_url', length: 100, nullable: true })
    imageUrl: string;

    @CreateDateColumn({ name: 'date_creation' })
    dateCreation: Date;
  
    @UpdateDateColumn({ name: 'date_modification' })
    dateModification: Date;

    @OneToMany(() => ComposantPack, (packItem) => packItem.pack, {cascade: true, eager: true, orphanedRowAction: 'delete' })
    composants: ComposantPack[];

    @OneToMany(() => LigneLocation, (l) => l.pack)
    ligneLocations: LigneLocation[];
    
    @Exclude()
    @Column({ type: 'varchar', length: 3,  nullable: false,  default: 'non' })
    isDelete: string;

    setIsdelete() : void{
      this.isDelete = "oui";
  }
  
    calculerTarifComposants(): number {
      if (!this.composants || this.composants.length === 0) return 0;
      return this.composants.reduce((total, c) => {
        const tarif = c.materiel.prixLocation ?? 0;
        return total + Number(tarif) * c.quantite;
      }, 0);
    }
  
    getCodesMaterielsRequis(): { codeMateriel: string; quantite: number }[] {
      return this.composants.map((c) => ({
        codeMateriel: c.materiel.CodeMateriel,
        quantite: c.quantite,
      }));
    }
  }