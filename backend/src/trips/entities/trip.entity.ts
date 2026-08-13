import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Currency, PricingMode, TripStatus } from '../../common/enums';
import { Concert } from '../../concerts/entities/concert.entity';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driverId' })
  driver: User;

  @Column()
  @Index()
  driverId: string;

  @ManyToOne(() => Vehicle, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column()
  vehicleId: string;

  @ManyToOne(() => Concert, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'concertId' })
  concert: Concert;

  @Column()
  @Index()
  concertId: string;

  @Column({ type: 'varchar', length: 32 })
  pricingMode: PricingMode;

  /** Total cost pool in minor currency units (e.g. cents). */
  @Column({ type: 'int' })
  totalCost: number;

  @Column({ type: 'varchar', length: 3, default: Currency.Eur })
  currency: Currency;

  @Column({ type: 'int' })
  minPassengers: number;

  @Column({ type: 'int' })
  maxPassengers: number;

  /** Go/no-go decision deadline, stored in UTC. */
  @Column({ type: 'timestamptz' })
  confirmationDeadline: Date;

  @Column({ type: 'timestamptz' })
  departureAt: Date;

  @Column({ default: false })
  roundTrip: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 16, default: TripStatus.Open })
  @Index()
  status: TripStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
