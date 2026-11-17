import { Module } from '@nestjs/common';
import { PackService } from './pack.service.js';
import { PackController } from './pack.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pack } from './entities/pack.entity.js';
import { DisponibiliteModule } from '../Disponibilite/disponibilite.module.js';
import { ComposantPack } from '../composant-pack/entities/composant-pack.entity.js';
import { Materiel } from '../../Catalogue/materiel/entities/materiel.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pack, ComposantPack, Materiel]),
    DisponibiliteModule
  ],
  controllers: [PackController],
  providers: [PackService],
    exports: [PackService]
})
export class PackModule {}
