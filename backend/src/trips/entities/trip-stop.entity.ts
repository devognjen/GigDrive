import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Trip } from './trip.entity';

@Entity('trip_stops')
@Unique(['tripId', 'seq'])
export class TripStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column()
  tripId: string;

  /** Stop order within the trip, starting at 1. */
  @Column({ type: 'int' })
  seq: number;

  @Column()
  place: string;

  @Column({ type: 'double precision', nullable: true })
  lat: number | null;

  @Column({ type: 'double precision', nullable: true })
  lng: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  plannedTime: Date | null;
}
