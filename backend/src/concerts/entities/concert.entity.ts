import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('concerts')
export class Concert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Provider-side identifier (Ticketmaster). NULL for manually created concerts. */
  @Column({ type: 'varchar', unique: true, nullable: true })
  externalId: string | null;

  /** True when created by a registered user instead of synced from the provider. */
  @Column({ default: false })
  userSubmitted: boolean;

  @Column()
  artist: string;

  @Column()
  title: string;

  @Column()
  venue: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column({ type: 'double precision', nullable: true })
  lat: number | null;

  @Column({ type: 'double precision', nullable: true })
  lng: number | null;

  /** Concert start, stored in UTC. */
  @Index()
  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  genre: string | null;

  @Column({ type: 'varchar', nullable: true })
  ticketUrl: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
