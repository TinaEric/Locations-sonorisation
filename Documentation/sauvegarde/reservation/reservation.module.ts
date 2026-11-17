import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service.js';
import { ReservationController } from './reservation.controller.js';
import { Reservation } from './entities/reservation.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigneLocation } from '../ligne-location/entities/ligne-location.entity.js';
import { Utilisateur } from '../../compteUser/utilisateur/entities/utilisateur.entity.js';
import { Materiel } from '../../Catalogue/materiel/entities/materiel.entity.js';
import { Item } from '../../Catalogue/item/entities/item.entity.js';
import { DisponibiliteModule } from '../Disponibilite/disponibilite.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, LigneLocation, Utilisateur, Materiel, Item]),
    DisponibiliteModule
  ],   
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService]
})
export class ReservationModule {}
