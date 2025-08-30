#!/bin/bash

# =============================================================================
# NUTRIBOT - LLM-Powered Nutritionist Assistant
# Setup Script for Development Environment
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js version $(node -v) is compatible"
            return 0
        else
            print_error "Node.js version $(node -v) is too old. Please install Node.js 18 or higher."
            return 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        return 1
    fi
}

# Function to check PostgreSQL
check_postgresql() {
    if command_exists psql; then
        print_success "PostgreSQL is installed"
        return 0
    else
        print_warning "PostgreSQL is not installed. You'll need to install it manually."
        print_status "Installation instructions:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
        echo "  macOS: brew install postgresql"
        echo "  Windows: Download from https://www.postgresql.org/download/windows/"
        return 1
    fi
}

# Function to check Redis
check_redis() {
    if command_exists redis-server; then
        print_success "Redis is installed"
        return 0
    else
        print_warning "Redis is not installed. You'll need to install it manually."
        print_status "Installation instructions:"
        echo "  Ubuntu/Debian: sudo apt-get install redis-server"
        echo "  macOS: brew install redis"
        echo "  Windows: Download from https://redis.io/download"
        return 1
    fi
}

# Function to create environment file
create_env_file() {
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp env.example .env
        print_success "Environment file created. Please edit .env with your configuration."
    else
        print_warning ".env file already exists. Skipping creation."
    fi
}

# Function to install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
}

# Function to install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    cd client
    npm install
    cd ..
    print_success "Frontend dependencies installed"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if PostgreSQL is running
    if ! pg_isready >/dev/null 2>&1; then
        print_error "PostgreSQL is not running. Please start PostgreSQL and try again."
        return 1
    fi
    
    # Create database if it doesn't exist
    if ! psql -lqt | cut -d \| -f 1 | grep -qw nutribot; then
        print_status "Creating database 'nutribot'..."
        createdb nutribot
        print_success "Database 'nutribot' created"
    else
        print_warning "Database 'nutribot' already exists"
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    npm run db:migrate
    print_success "Database migrations completed"
}

# Function to seed database
seed_database() {
    print_status "Seeding database with initial data..."
    npm run db:seed
    print_success "Database seeded"
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend..."
    cd client
    npm run build
    cd ..
    print_success "Frontend built successfully"
}

# Function to create logs directory
create_logs_directory() {
    print_status "Creating logs directory..."
    mkdir -p logs
    print_success "Logs directory created"
}

# Function to set up development environment
setup_dev_environment() {
    print_status "Setting up development environment..."
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p uploads
    mkdir -p temp
    
    # Set proper permissions
    chmod 755 logs
    chmod 755 uploads
    chmod 755 temp
    
    print_success "Development environment setup completed"
}

# Function to display next steps
display_next_steps() {
    echo ""
    echo "============================================================================="
    echo "🎉 NUTRIBOT SETUP COMPLETED SUCCESSFULLY!"
    echo "============================================================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. 📝 Configure your environment:"
    echo "   - Edit .env file with your configuration"
    echo "   - Add your OpenAI API key"
    echo "   - Configure database connection"
    echo ""
    echo "2. 🚀 Start the application:"
    echo "   - Development mode: npm run dev"
    echo "   - Production mode: npm start"
    echo ""
    echo "3. 🌐 Access the application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:3001"
    echo ""
    echo "4. 📚 Documentation:"
    echo "   - README.md for detailed information"
    echo "   - API documentation available at /api/docs"
    echo ""
    echo "5. 🔒 Privacy Compliance:"
    echo "   - Review privacy settings in .env"
    echo "   - Ensure GDPR/LOPDGDD compliance"
    echo ""
    echo "6. 🧪 Testing:"
    echo "   - Run tests: npm test"
    echo "   - Security audit: npm run security:audit"
    echo ""
    echo "For support and questions:"
    echo "   - Technical: tech@nutribot.com"
    echo "   - Privacy: privacy@nutribot.com"
    echo "   - Legal: legal@nutribot.com"
    echo ""
    echo "============================================================================="
}

# Main setup function
main() {
    echo ""
    echo "============================================================================="
    echo "🚀 NUTRIBOT - LLM-Powered Nutritionist Assistant"
    echo "🔒 GDPR/LOPDGDD Compliant Setup Script"
    echo "============================================================================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_node_version; then
        print_error "Node.js version check failed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    if ! check_postgresql; then
        print_warning "PostgreSQL check failed. Please install PostgreSQL."
    fi
    
    if ! check_redis; then
        print_warning "Redis check failed. Please install Redis."
    fi
    
    # Create environment file
    create_env_file
    
    # Install dependencies
    install_backend_deps
    install_frontend_deps
    
    # Setup development environment
    setup_dev_environment
    
    # Setup database (if PostgreSQL is available)
    if command_exists psql; then
        if setup_database; then
            run_migrations
            seed_database
        else
            print_warning "Database setup skipped. Please configure PostgreSQL manually."
        fi
    else
        print_warning "Database setup skipped. Please install PostgreSQL first."
    fi
    
    # Build frontend
    build_frontend
    
    # Display next steps
    display_next_steps
}

# Run main function
main "$@"

