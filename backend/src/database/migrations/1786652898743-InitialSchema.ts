import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1786652898743 implements MigrationInterface {
  name = 'InitialSchema1786652898743';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "concerts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "externalId" character varying, "userSubmitted" boolean NOT NULL DEFAULT false, "artist" character varying NOT NULL, "title" character varying NOT NULL, "venue" character varying NOT NULL, "city" character varying NOT NULL, "country" character varying NOT NULL, "lat" double precision, "lng" double precision, "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "imageUrl" character varying, "genre" character varying, "ticketUrl" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_669652b712e346fbece1ec8ff19" UNIQUE ("externalId"), CONSTRAINT "PK_6ca96059628588a3988a5f3236a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7b08af7fe29ec6c3fdfa0cc3f2" ON "concerts"  ("startAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "phone" character varying, "emailNotifications" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "type" character varying(16) NOT NULL, "make" character varying NOT NULL, "model" character varying NOT NULL, "seats" integer NOT NULL, "notes" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "trips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "driverId" uuid NOT NULL, "vehicleId" uuid NOT NULL, "concertId" uuid NOT NULL, "pricingMode" character varying(32) NOT NULL, "totalCost" integer NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'EUR', "minPassengers" integer NOT NULL, "maxPassengers" integer NOT NULL, "confirmationDeadline" TIMESTAMP WITH TIME ZONE NOT NULL, "departureAt" TIMESTAMP WITH TIME ZONE NOT NULL, "roundTrip" boolean NOT NULL DEFAULT false, "notes" text, "status" character varying(16) NOT NULL DEFAULT 'OPEN', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc5a8911f85074a660a4304baa" ON "trips"  ("driverId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_102814a3c2fe21508acd5cf980" ON "trips"  ("concertId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1e9de13bac402d95dad6f116e0" ON "trips"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tripId" uuid NOT NULL, "passengerId" uuid NOT NULL, "seats" integer NOT NULL, "status" character varying(32) NOT NULL DEFAULT 'PENDING', "paid" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "decidedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e33f0b046a54956d011b3d377e" ON "bookings"  ("tripId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "trip_stops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tripId" uuid NOT NULL, "seq" integer NOT NULL, "place" character varying NOT NULL, "lat" double precision, "lng" double precision, "plannedTime" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_949476d0a4323f0169c2b94beaf" UNIQUE ("tripId", "seq"), CONSTRAINT "PK_876633f878970267cb0dc525984" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_c0a0d32b2ae04801d6e5b9e5c80" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_fc5a8911f85074a660a4304baa1" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_d3cea80b69fc4ecfd2273068395" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_102814a3c2fe21508acd5cf9800" FOREIGN KEY ("concertId") REFERENCES "concerts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_e33f0b046a54956d011b3d377ef" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_4ddbabffcf7921575886059d5c0" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trip_stops" ADD CONSTRAINT "FK_37cc2e3103d3ad66b08b7ba220d" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trip_stops" DROP CONSTRAINT "FK_37cc2e3103d3ad66b08b7ba220d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_4ddbabffcf7921575886059d5c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_e33f0b046a54956d011b3d377ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_102814a3c2fe21508acd5cf9800"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_d3cea80b69fc4ecfd2273068395"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_fc5a8911f85074a660a4304baa1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_c0a0d32b2ae04801d6e5b9e5c80"`,
    );
    await queryRunner.query(`DROP TABLE "trip_stops"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e33f0b046a54956d011b3d377e"`,
    );
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1e9de13bac402d95dad6f116e0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_102814a3c2fe21508acd5cf980"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fc5a8911f85074a660a4304baa"`,
    );
    await queryRunner.query(`DROP TABLE "trips"`);
    await queryRunner.query(`DROP TABLE "vehicles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7b08af7fe29ec6c3fdfa0cc3f2"`,
    );
    await queryRunner.query(`DROP TABLE "concerts"`);
  }
}
