# NutriBot - LLM-Powered Nutritionist Assistant

A privacy-compliant chatbot application that serves as an extension to nutritionists, designed to comply with Spanish privacy laws (GDPR and LOPDGDD).

## 🛡️ Privacy Compliance Features

### Spanish Law Compliance
- **GDPR & LOPDGDD Compliance**: Full adherence to Spanish data protection regulations
- **Explicit Consent Management**: Granular consent options for different data uses
- **Data Minimization**: Only collects necessary health information
- **Right to Erasure**: Complete data deletion upon user request
- **Data Portability**: Export personal data in machine-readable format
- **Transparency**: Clear privacy policies and data handling practices

### Security Features
- **End-to-End Encryption**: All communications encrypted
- **Data Anonymization**: Sensitive data anonymized before LLM processing
- **Access Control**: Role-based permissions for users and nutritionists
- **Audit Logging**: Complete audit trail for compliance
- **Secure Storage**: EU-based data storage with encryption at rest

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Interface│    │  API Gateway    │    │ Authentication  │
│   (Web/Mobile)  │───▶│   (Security)    │───▶│   & Consent     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Data Processing│    │  LLM Inference  │    │ Nutritionist    │
│ & Anonymization │◀───│     Engine      │───▶│    Portal       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Secure Storage  │
                       │ (Encrypted DB)  │
                       └─────────────────┘
```

## 🚀 Features

### For Users
- **Intelligent Health Assessment**: LLM-powered questionnaire system
- **Personalized Recommendations**: AI-generated nutrition advice
- **Privacy Controls**: Complete control over data sharing
- **Data Export**: Download personal health data anytime
- **Consent Management**: Granular consent for different data uses

### For Nutritionists
- **Patient Overview**: View anonymized patient insights
- **AI-Generated Reports**: Automated health assessments
- **Intervention Alerts**: Notifications for critical health indicators
- **Secure Communication**: Encrypted messaging with patients

## 🛠️ Technology Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with encryption
- **LLM**: OpenAI GPT-4 (configurable)
- **Authentication**: JWT with MFA
- **Encryption**: AES-256 for data at rest, TLS 1.3 for transit

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Windows 10/11 (64-bit)
- 16GB RAM mínimo (32GB recomendado para gpt-oss:20b)
- 50GB espacio libre para el modelo

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd nutri-bot
```

2. **Install Ollama and GPT-OSS:20B**
```powershell
# Run as administrator
.\install-gpt-oss.ps1
```

3. **Install dependencies**
```bash
npm install
```

4. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Database setup**
```bash
npm run db:migrate
npm run db:seed
```

6. **Start the application**
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nutribot

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# JWT
JWT_SECRET=your_jwt_secret

# Encryption
ENCRYPTION_KEY=your_encryption_key

# Privacy Settings
DATA_RETENTION_DAYS=730
ANONYMIZATION_ENABLED=true
```

## 📊 Data Flow

1. **User Registration**: Explicit consent collection
2. **Health Assessment**: Structured questionnaire with LLM analysis
3. **Data Processing**: Anonymization before LLM processing
4. **Recommendations**: AI-generated nutrition advice
5. **Nutritionist Review**: Professional oversight and intervention
6. **Data Retention**: Automated deletion after retention period

## 🔒 Privacy by Design

### Data Collection
- Only essential health information collected
- Explicit consent for each data use
- Clear purpose limitation

### Data Processing
- Anonymization before LLM processing
- Pseudonymization for analytics
- Data minimization throughout

### Data Storage
- EU-based servers only
- Encryption at rest and in transit
- Access controls and audit logging

### User Rights
- Right to access personal data
- Right to rectification
- Right to erasure
- Right to data portability
- Right to object to processing

## 📝 Legal Compliance

### Spanish Laws Addressed
- **GDPR**: General Data Protection Regulation
- **LOPDGDD**: Spanish Data Protection Law
- **AEPD Guidelines**: Spanish Data Protection Agency
- **AESIA**: Spanish AI Supervision Agency

### Required Documentation
- Privacy Policy (Spanish)
- Terms of Service (Spanish)
- Data Processing Agreement
- Consent Management Records
- Data Protection Impact Assessment (DPIA)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For privacy compliance questions or technical support, please contact:
- Technical: tech@nutribot.com
- Privacy: privacy@nutribot.com
- Legal: legal@nutribot.com
