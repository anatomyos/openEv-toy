import { PrismaClient } from '../app/generated/prisma/index.js';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create sample medical articles
  const articles = [
    {
      title: 'Recent Advances in mRNA Vaccine Technology',
      abstract: 'This comprehensive review examines the latest developments in mRNA vaccine technology, highlighting their role in combating infectious diseases and potential applications in cancer immunotherapy.',
      authors: ['Smith, J.', 'Johnson, M.', 'Williams, R.'],
      keywords: ['mRNA', 'vaccines', 'immunology', 'biotechnology'],
      publishDate: new Date('2024-01-15'),
      source: 'Journal of Immunology Research',
      url: 'https://example.com/mrna-vaccine-advances',
    },
    {
      title: 'Artificial Intelligence in Medical Diagnosis',
      abstract: 'An analysis of how AI and machine learning algorithms are revolutionizing medical diagnosis, with particular focus on radiology and pathology applications.',
      authors: ['Chen, L.', 'Patel, S.', 'Garcia, A.'],
      keywords: ['artificial intelligence', 'medical diagnosis', 'machine learning', 'healthcare technology'],
      publishDate: new Date('2024-02-01'),
      source: 'Digital Health Journal',
      url: 'https://example.com/ai-medical-diagnosis',
    },
    {
      title: "Novel Treatments for Alzheimer's Disease",
      abstract: "This study presents emerging therapeutic approaches for Alzheimer's disease, including targeted immunotherapy and novel drug delivery systems.",
      authors: ['Brown, K.', 'Lee, H.', 'Anderson, P.'],
      keywords: ["Alzheimer's", 'neurology', 'immunotherapy', 'drug delivery'],
      publishDate: new Date('2024-01-20'),
      source: 'Neuroscience Today',
      url: 'https://example.com/alzheimers-treatments',
    },
  ];

  for (const article of articles) {
    await prisma.medicalArticle.upsert({
      where: { title: article.title },
      update: {},
      create: article,
    });
  }

  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 