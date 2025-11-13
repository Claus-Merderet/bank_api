<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251108132045 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE account (id SERIAL NOT NULL, user_id INT NOT NULL, number VARCHAR(7) NOT NULL, balance DOUBLE PRECISION NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_7D3656A4A76ED395 ON account (user_id)');
        $this->addSql('CREATE TABLE credit (id SERIAL NOT NULL, account_id INT NOT NULL, amount DOUBLE PRECISION NOT NULL, term_months INT NOT NULL, balance DOUBLE PRECISION NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_1CC16EFE9B6B5FBA ON credit (account_id)');
        $this->addSql('CREATE TABLE transaction (id SERIAL NOT NULL, account_id INT NOT NULL, related_account_id INT NOT NULL, �amount DOUBLE PRECISION NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_723705D19B6B5FBA ON transaction (account_id)');
        $this->addSql('CREATE INDEX IDX_723705D111A6570A ON transaction (related_account_id)');
        $this->addSql('CREATE TABLE "user" (id SERIAL NOT NULL, username VARCHAR(50) NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('ALTER TABLE account ADD CONSTRAINT FK_7D3656A4A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE credit ADD CONSTRAINT FK_1CC16EFE9B6B5FBA FOREIGN KEY (account_id) REFERENCES account (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transaction ADD CONSTRAINT FK_723705D19B6B5FBA FOREIGN KEY (account_id) REFERENCES account (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transaction ADD CONSTRAINT FK_723705D111A6570A FOREIGN KEY (related_account_id) REFERENCES account (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE account DROP CONSTRAINT FK_7D3656A4A76ED395');
        $this->addSql('ALTER TABLE credit DROP CONSTRAINT FK_1CC16EFE9B6B5FBA');
        $this->addSql('ALTER TABLE transaction DROP CONSTRAINT FK_723705D19B6B5FBA');
        $this->addSql('ALTER TABLE transaction DROP CONSTRAINT FK_723705D111A6570A');
        $this->addSql('DROP TABLE account');
        $this->addSql('DROP TABLE credit');
        $this->addSql('DROP TABLE transaction');
        $this->addSql('DROP TABLE "user"');
    }
}
