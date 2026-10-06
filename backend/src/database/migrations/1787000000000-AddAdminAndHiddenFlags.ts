import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminAndHiddenFlags1787000000000 implements MigrationInterface {
  name = 'AddAdminAndHiddenFlags1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "isAdmin" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "disabledAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "concerts" ADD "hidden" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "concerts" DROP COLUMN "hidden"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "disabledAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isAdmin"`);
  }
}
