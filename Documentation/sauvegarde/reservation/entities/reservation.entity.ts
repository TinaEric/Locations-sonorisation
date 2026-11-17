import { Entity, PrimaryColumn,CreateDateColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { LigneLocation } from '../../ligne-location/entities/ligne-location.entity.js';
import { Paiement } from '../../paiement/entities/paiement.entity.js';
import type { Relation } from 'typeorm';
import type { Utilisateur } from '../../../compteUser/utilisateur/entities/utilisateur.entity.js';
import { ModeRetrait, StatutLocation } from '../enum/enum-location.js';
import { decimalTransformer } from '../../../Utilitaires/decimal-transformer.js';
import { Exclude } from 'class-transformer';

@Entity('reservation')
export class Reservation {
    
    @PrimaryColumn({ type: 'varchar', length: 15 })
    numReservation: string;  //CLI0235-LCT0001

    @CreateDateColumn({ type: 'timestamp' })
    dateCreation: Date;

    @Column({ type: 'date'})
    dateDebutPrevue: Date;

    @Column({ type: 'date'})
    dateFinPrevue: Date;
    
    @Column({ type: 'varchar', length: 50 , nullable: true})
    lieuEvenement: string;

    @Column({ type: 'varchar', length: 255, nullable: true})
    remarques: string;

    @Column({ type: 'enum', enum: StatutLocation, default: StatutLocation.EN_ATTENTE })
    statutLocation: StatutLocation;

    @Column({ type: 'enum', enum: ModeRetrait, default: ModeRetrait.SUR_PLACE })
    modeRetrait: ModeRetrait;

    @Column('decimal', { precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
    fraisLivraison: number;
  
    @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
    montantTotal: number;

    @Column({ type: 'date', nullable: true })
    dateRetourReel: Date;

    @ManyToOne('Utilisateur', 'reservations')
    utilisateur: Relation<Utilisateur>;

    @OneToMany(() => LigneLocation, (ligne) => ligne.reservation, { cascade: true, orphanedRowAction: 'delete' })
    ligneLocations: LigneLocation[];

    @OneToMany(() => Paiement, (ligne) => ligne.reservations, { cascade: true, orphanedRowAction: 'delete' })
    paiements: Paiement[];

    @Exclude()
    @Column({ type: 'varchar', length: 3,  nullable: false,  default: 'non' })
    isDelete: string;
    
    setIsdelete() : void{
        this.isDelete = "oui";
    }
    
    setStatutLocation(nouveauStatut: StatutLocation): void {
        this.statutLocation = nouveauStatut;
    }

    calculerDuree(): number {
        const ms = new Date(this.dateFinPrevue).getTime() - new Date(this.dateDebutPrevue).getTime();
        return Math.max(1, Math.ceil(ms / 86_400_000));
      }
    
    calculMontantTotal(): number {
        const nbJours = this.calculerDuree();
        const sousTotal = (this.ligneLocations ?? []).reduce(
          (somme, ligne) => somme + ligne.calculSubTotal(nbJours),
          0,
        );
        return Math.round((sousTotal + (this.fraisLivraison ?? 0)) * 100) / 100;
    }
}
