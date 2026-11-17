import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, HttpCode } from '@nestjs/common';
import { ReservationService } from './reservation.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { UpdateReservationDto } from './dto/update-reservation.dto.js';
import { ListeDisponibleDto } from './dto/liste-disponible.dto.js';
import { CreateMouvementsLigneDto } from '../mouvement/dto/mouvement-item.dto.js';

@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.create(createReservationDto);
  }

  @Post(':numReservation/lignes/:ligneId/mouvements')
  creerMouvementsLigne(
    @Param('numReservation') numReservation: string,
    @Param('ligneId', ParseIntPipe) ligneId: number,
    @Body() dto: CreateMouvementsLigneDto,
  ) {
    return this.reservationService.creerMouvementsLigne(numReservation, ligneId, dto);
  }

  @Post('materiels-disponibles')
  materielsDisponibles(@Body() data: ListeDisponibleDto) {
    return this.reservationService.materielsDisponibles(data.dateDebut, data.dateFin);
  }

  @Post('creer')
  @HttpCode(201)
  creer(@Body() dto: CreateReservationDto) {
    return this.reservationService.creerReservation(dto);
  }

  @Get(':numReservation/items-disponibles')
  itemsDisponiblesParLigne(@Param('numReservation') numReservation: string) {
    return this.reservationService.itemsDisponiblesParLigne(numReservation);
  }

  @Get()
  findAll() {
    return this.reservationService.findAll();
  }

  @Get(':num')
  findOne(@Param('num') num: string) {
    return this.reservationService.findOne(num);
  }

  @Patch(':num')
  update(@Param('num') num: string, @Body() updateReservationDto: UpdateReservationDto) {
    return this.reservationService.update(num, updateReservationDto);
  }

  @Delete(':num')
  remove(@Param('num') num: string) {
    return this.reservationService.remove(num);
  }
}
