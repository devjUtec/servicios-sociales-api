import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
// @ts-ignore
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting seed...');

    // 1. CLEANUP (Careful with order due to FK)
    console.log('🧹 Cleaning database...');
    // @ts-ignore
    await prisma.auditLog.deleteMany();
    // @ts-ignore
    await prisma.oTP?.deleteMany();
    // @ts-ignore
    await prisma.otp?.deleteMany();
    // @ts-ignore
    await prisma.contribution.deleteMany();
    // @ts-ignore
    await prisma.affiliation.deleteMany();
    // @ts-ignore
    await prisma.medicalRecord.deleteMany();
    // @ts-ignore
    await prisma.userRole.deleteMany();
    // @ts-ignore
    await prisma.role.deleteMany();
    // @ts-ignore
    await prisma.refreshToken.deleteMany();
    // @ts-ignore
    await prisma.citizenRefreshToken.deleteMany();
    // @ts-ignore
    await prisma.user.deleteMany();
    // @ts-ignore
    await prisma.citizen.deleteMany();

    console.log('✨ Clean finish.');

    // 2. ROLES
    const roles = [
        { name: 'super_admin', description: 'Total system control' },
        { name: 'doctor', description: 'Can view and create medical records' },
        { name: 'institution_staff', description: 'Can manage affiliations and contributions' },
        { name: 'citizen', description: 'The social service beneficiary' },
    ];

    for (const role of roles) {
        await prisma.role.create({
            data: {
                name: role.name,
                description: role.description,
                permissions: {},
            },
        });
    }
    console.log('🎭 Roles created.');

    const adminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
    const doctorRole = await prisma.role.findUnique({ where: { name: 'doctor' } });

    // 3. INTERNAL USERS
    const hashedAdminPassword = await bcrypt.hash('Admin123!', 10);
    const superAdmin = await prisma.user.create({
        data: {
            email: 'admin@ssapi.gob.sv',
            passwordHash: hashedAdminPassword,
            firstName: 'Super',
            lastName: 'Admin',
            isVerified: true,
        },
    });

    if (adminRole) {
        await prisma.userRole.create({
            data: {
                userId: superAdmin.id,
                roleId: adminRole.id,
            },
        });
    }

    // Create 3 Doctors
    for (let i = 1; i <= 3; i++) {
        const doctor = await prisma.user.create({
            data: {
                email: `doctor${i}@isss.gob.sv`,
                passwordHash: hashedAdminPassword,
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                isVerified: true,
            },
        });
        if (doctorRole) {
            await prisma.userRole.create({
                data: {
                    userId: doctor.id,
                    roleId: doctorRole.id,
                },
            });
        }
    }
    console.log('👤 Internal users created.');

    // 4. CITIZENS
    console.log('👥 Generating test citizen and 20 random citizens...');
    const hashedCitizenPassword = await bcrypt.hash('Cotizante123!', 10);

    // Fixed test citizen for developers
    const testCitizen = await prisma.citizen.create({
        data: {
            id: 'be44ad3c-8ec8-4d6e-b3c9-6600767e5acd', // ID FIJO
            email: '2916392019@mail.utec.edu.sv',
            passwordHash: hashedCitizenPassword,
            firstName: 'Juan',
            lastName: 'Perez',
            idNumber: '000000000',
            affiliationNumber: 'ISS-12345',
            address: 'San Salvador, El Salvador',
            phone: '2222-3333',
            dateOfBirth: new Date('1990-01-01'),
            gender: 'M',
            isVerified: true,
        },
    });

    const testAffiliation = await prisma.affiliation.create({
        data: {
            citizenId: testCitizen.id,
            affiliationNumber: 'ISS-12345',
            affiliationType: 'Cotizante Activo',
            institutionType: 'ISSS',
            employer: 'Empresa Test S.A. de C.V.',
            employerTaxId: '0614-010101-101-1',
            department: 'San Salvador',
        },
    });

    // 5. TEST CITIZEN EXTRAS (Contributions & Medical Records)
    console.log('💳 Generating test contributions and medical records...');
    const periods = ['2026-03', '2026-02', '2026-01', '2025-12', '2025-11'];
    for (const period of periods) {
        await prisma.contribution.create({
            data: {
                citizenId: testCitizen.id,
                affiliationId: testAffiliation.id,
                period: period,
                baseAmount: 1000.00,
                percentage: 7.5,
                contributionAmount: 75.00,
                employer: 'Empresa Test S.A. de C.V.',
                employerTaxId: '0614-010101-101-1',
                status: 'paid',
                paymentDate: new Date(`${period}-15`),
                reference: `REF-${period}-${Math.floor(Math.random() * 1000)}`,
            },
        });
    }

    const testMedicalRecords = [
        {
            recordNumber: `EXP-TEST-001`,
            recordType: 'Consulta General',
            diagnosis: 'Infección respiratoria leve',
            treatment: 'Reposo y analgésicos',
            primaryDoctor: 'Dr. Roberto Gomez',
            specialty: 'Medicina General',
            department: 'Medicina Interna',
            visitDate: new Date('2026-03-10'),
            priority: 'normal',
            status: 'closed',
        },
        {
            recordNumber: `EXP-TEST-002`,
            recordType: 'Control Anual',
            diagnosis: 'Paciente sano, parámetros normales',
            treatment: 'Continuar con dieta balanceada',
            primaryDoctor: 'Dra. Elena Rivas',
            specialty: 'Nutriología',
            department: 'Nutrición',
            visitDate: new Date('2026-02-15'),
            priority: 'low',
            status: 'closed',
        },
    ];

    for (const record of testMedicalRecords) {
        await prisma.medicalRecord.create({
            data: {
                ...record,
                citizenId: testCitizen.id,
            },
        });
    }

    for (let i = 0; i < 20; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();

        const citizen = await prisma.citizen.create({
            data: {
                email: faker.internet.email({ firstName, lastName }).toLowerCase(),
                passwordHash: hashedCitizenPassword,
                firstName: firstName,
                lastName: lastName,
                idNumber: faker.string.numeric(9),
                affiliationNumber: faker.string.alpha(10).toUpperCase(),
                address: faker.location.streetAddress(),
                phone: faker.phone.number(),
                dateOfBirth: faker.date.birthdate({ min: 18, max: 70, mode: 'age' }),
                gender: faker.helpers.arrayElement(['M', 'F']),
                isVerified: true,
            },
        });

        const insts = [
            { name: 'ISSS', type: 'Public Health' },
            { name: 'AFP Crecer', type: 'Pension Fund' },
        ];

        for (const inst of insts) {
            const affiliation = await prisma.affiliation.create({
                data: {
                    citizenId: citizen.id,
                    affiliationNumber: faker.string.alpha(10).toUpperCase(),
                    affiliationType: 'Active Worker',
                    institutionType: inst.name,
                    employer: faker.company.name(),
                    employerTaxId: faker.string.numeric(14),
                    department: faker.location.state(),
                },
            });

            for (let m = 1; m <= 6; m++) { // 6 months for speed
                const baseAmount = faker.number.float({ min: 500, max: 2500, fractionDigits: 2 });
                await prisma.contribution.create({
                    data: {
                        citizenId: citizen.id,
                        affiliationId: affiliation.id,
                        period: `2024-0${m}`,
                        baseAmount: baseAmount,
                        contributionAmount: baseAmount * 0.075,
                        employer: affiliation.employer!,
                        employerTaxId: affiliation.employerTaxId!,
                        status: 'paid',
                        paymentDate: new Date(`2024-0${m}-05`),
                    },
                });
            }
        }
    }

    console.log('✅ Seed finished successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        pool.end();
    });
