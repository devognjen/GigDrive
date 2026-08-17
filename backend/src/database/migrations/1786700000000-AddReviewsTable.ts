import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewsTable1786700000000 implements MigrationInterface {
  name = 'AddReviewsTable1786700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tripId" uuid NOT NULL, "authorId" uuid NOT NULL, "rating" integer NOT NULL, "comment" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_reviews" PRIMARY KEY ("id"), CONSTRAINT "UQ_reviews_trip_author" UNIQUE ("tripId", "authorId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_tripId" ON "reviews" ("tripId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_trip" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_author" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_author"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_trip"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_reviews_tripId"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
  }
}
