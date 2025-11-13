<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251110183624 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE transaction ADD credit_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE transaction ADD transaction_type VARCHAR(20) DEFAULT NULL');

        // Заполняем существующие записи с правильной логикой
        $this->addSql("
        UPDATE transaction
        SET transaction_type = CASE
            WHEN from_account_id IS NULL THEN 'deposit'
            WHEN to_account_id != from_account_id THEN 'transfer'
            ELSE 'deposit'
        END
    ");

        $this->addSql('ALTER TABLE transaction ALTER COLUMN transaction_type SET NOT NULL');
        $this->addSql('ALTER TABLE transaction ADD CONSTRAINT FK_723705D1CE062FF9 FOREIGN KEY (credit_id) REFERENCES credit (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_723705D1CE062FF9 ON transaction (credit_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE transaction DROP CONSTRAINT FK_723705D1CE062FF9');
        $this->addSql('DROP INDEX IDX_723705D1CE062FF9');
        $this->addSql('ALTER TABLE transaction DROP credit_id');
        $this->addSql('ALTER TABLE transaction DROP transaction_type');
    }
}
