import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BookingStatus } from '../../common/enums';
import { Trip } from '../../trips/entities/trip.entity';
import { User } from '../../users/entities/user.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column()
  @Index()
  tripId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'passengerId' })
  passenger: User;

  @Column()
  passengerId: string;

  @Column({ type: 'int' })
  seats: number;

  @Column({ type: 'varchar', length: 32, default: BookingStatus.Pending })
  status: BookingStatus;

  /** Informational only — the driver marks cash/bank payment received. */
  @Column({ default: false })
  paid: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /** When the driver accepted/rejected, or the passenger cancelled. */
  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;
}
