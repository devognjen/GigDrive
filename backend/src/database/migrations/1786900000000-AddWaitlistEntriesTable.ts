import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaitlistEntriesTable1786900000000 implements MigrationInterface {
  name = 'AddWaitlistEntriesTable1786900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "waitlist_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tripId" uuid NOT NULL, "passengerId" uuid NOT NULL, "seats" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_waitlist_entries" PRIMARY KEY ("id"), CONSTRAINT "UQ_waitlist_trip_passenger" UNIQUE ("tripId", "passengerId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_waitlist_entries_tripId" ON "waitlist_entries" ("tripId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlist_entries" ADD CONSTRAINT "FK_waitlist_entries_trip" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlist_entries" ADD CONSTRAINT "FK_waitlist_entries_passenger" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "waitlist_entries" DROP CONSTRAINT "FK_waitlist_entries_passenger"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlist_entries" DROP CONSTRAINT "FK_waitlist_entries_trip"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_waitlist_entries_tripId"`,
    );
    await queryRunner.query(`DROP TABLE "waitlist_entries"`);
  }
}
