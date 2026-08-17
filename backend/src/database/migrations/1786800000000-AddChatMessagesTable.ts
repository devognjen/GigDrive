import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatMessagesTable1786800000000 implements MigrationInterface {
  name = 'AddChatMessagesTable1786800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tripId" uuid NOT NULL, "authorId" uuid NOT NULL, "body" text NOT NULL, "sentAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chat_messages_tripId" ON "chat_messages" ("tripId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_trip" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_author" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_author"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_trip"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_tripId"`);
    await queryRunner.query(`DROP TABLE "chat_messages"`);
  }
}
