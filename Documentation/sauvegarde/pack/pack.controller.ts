import { Controller, Get, Post,HttpCode, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PackService } from './pack.service.js';
import { CreatePackDto } from './dto/create-pack.dto.js';
import { UpdatePackDto } from './dto/update-pack.dto.js';
import { PacksDisponiblesDto } from './dto/packs-disponibles.dto.js';
import { CreateComposantPackDto } from './dto/pack-composant.dto.js';
import { ComposantPack } from '../composant-pack/entities/composant-pack.entity.js';
import { PackPublicDto } from './dto/pack-public.dto.js';

@Controller('pack')
export class PackController {
  constructor(private readonly packService: PackService) {}

  @Post()
  create(@Body() createPackDto: CreatePackDto) {
    return this.packService.createPackInfo(createPackDto);
  }

  @Post(':codePack/composants')
  addComposants(
    @Param('codePack') codePack: string,
    @Body() listeMat: CreateComposantPackDto[],
  ): Promise<ComposantPack[]> {
    return this.packService.addComposantsToPack(codePack, listeMat);
  }

  @Get(':codePack/public')
  findOnePublic(
    @Param('codePack') codePack: string,
    @Query() dto: PackPublicDto,
  ) {
    return this.packService.findOnePublicAvecStock(
      codePack,
      dto.dateDebut,
      dto.dateFin,
    );
  }

  @Post('disponibles')
  disponibles(@Body() dto: PacksDisponiblesDto) {
    return this.packService.disponibles(dto);
  }

  @Get()
  findAll() {
    return this.packService.findAll();
  }

  @Get('typeEvenement')
  getTypeEvenement() {
    return this.packService.getTypeEvenement();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePackDto: UpdatePackDto) {
    return this.packService.update(id, updatePackDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packService.remove(id);
  }

}
