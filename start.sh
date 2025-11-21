#!/bin/sh

echo "🚀 Starting Bank API..."

echo "📁 Creating PostgreSQL directories..."
mkdir -p /run/postgresql
chown postgres:postgres /run/postgresql

echo "🐘 Starting PostgreSQL..."
su postgres -c "postgres -D /var/lib/postgresql/data -h 0.0.0.0 -k /tmp" &
POSTGRES_PID=$!

echo "⏳ Waiting for database to start..."
sleep 3

if ps aux | grep -q [p]ostgres; then
    echo "✅ PostgreSQL is running!"
else
    echo "❌ PostgreSQL failed to start, retrying..."
    sleep 2
    su postgres -c "postgres -D /var/lib/postgresql/data -h 0.0.0.0 -k /tmp" &
    sleep 3
fi

echo "🗃️ Setting up database..."
export PGHOST=/tmp
su postgres -c "psql -h /tmp -c \"CREATE USER symfony WITH PASSWORD 'password';\" 2>/dev/null" || true
su postgres -c "psql -h /tmp -c \"CREATE DATABASE symfony_db OWNER symfony;\" 2>/dev/null" || true
su postgres -c "psql -h /tmp -c \"GRANT ALL PRIVILEGES ON DATABASE symfony_db TO symfony;\" 2>/dev/null" || true
export DATABASE_URL="postgresql://symfony:password@localhost:5432/symfony_db?serverVersion=15&charset=utf8"
export DATABASE_HOST="localhost"
export DATABASE_PORT="5432"
export DATABASE_NAME="symfony_db"
export DATABASE_USER="symfony"
export DATABASE_PASSWORD="password"
echo "🔄 Running migrations..."
php bin/console doctrine:migrations:migrate --no-interaction

echo "📦 Loading fixtures..."
php bin/console doctrine:fixtures:load --no-interaction

echo "✅ Database is set up!"
echo "📚 API Documentation: http://localhost:4111/api/swagger"
echo "🔐 Test credentials: admin / 123456"

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
