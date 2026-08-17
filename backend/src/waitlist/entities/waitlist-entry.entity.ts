import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { User } from '../../users/entities/user.entity';

@Entity('waitlist_entries')
@Index('UQ_waitlist_trip_passenger', ['tripId', 'passengerId'], {
  unique: true,
})
export class WaitlistEntry {
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

  /** Seats the passenger hopes to book; display-only, does not reserve capacity. */
  @Column({ type: 'int' })
  seats: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
