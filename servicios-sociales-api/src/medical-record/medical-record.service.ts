import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MedicalRecordService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async create(data: any) {
    const { citizenId, recordNumber, recordType, visitDate, diagnosis, treatment, notes, priority, primaryDoctor, specialty, department } = data;

    const record = await this.prisma.medicalRecord.create({
      data: {
        citizenId,
        recordNumber,
        recordType,
        visitDate,
        diagnosis,
        treatment,
        notes,
        priority,
        primaryDoctor,
        specialty,
        department,
        status: 'closed',
      },
      include: {
        citizen: true
      }
    });

    // AUDITORÍA (CORREGIDO)
    await this.auditService.createLog({
      action: 'CREATE_MEDICAL_RECORD',
      userId: data.adminId,
      email: data.adminEmail,
      citizenId: citizenId,
      resourceType: 'MEDICAL_RECORD',
      resourceId: record.id,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      metadata: { diagnosis, doctor: primaryDoctor }
    });

    return record;
  }

  async findAll() {
    return this.prisma.medicalRecord.findMany({
      include: {
        citizen: true,
      },
      orderBy: { visitDate: 'desc' },
    });
  }

  async findByCitizenId(citizenId: string) {
    return this.prisma.medicalRecord.findMany({
      where: { citizenId },
      orderBy: { visitDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: { citizen: true },
    });
    if (!record) throw new NotFoundException('Expediente no encontrado');
    return record;
  }
}
