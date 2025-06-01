import { Injectable ,BadRequestException, NotFoundException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class StudentService {
    constructor(private readonly prisma: PrismaService) {}

    async RejectEnrollement(enrollmentId: string): Promise<string> {
        const enrollmentIdNum = parseInt(enrollmentId, 10);

        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentIdNum },
        });

        if (!enrollment) {
            throw new NotFoundException('Enrollment not found');
        }

        if (enrollment.status !== 'PENDING') {
            throw new BadRequestException('Cannot reject a non-pending enrollment');
        }

        await this.prisma.enrollment.delete({
            where: { id: enrollmentIdNum },
        });

        return `Enrollment ${enrollmentId} rejected successfully`;
    }

    async AcceptEnrollement(enrollmentId: string): Promise<string> {
        const enrollmentIdNum = parseInt(enrollmentId, 10);

        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentIdNum },
        });

        if (!enrollment) {
            throw new NotFoundException('Enrollment not found');
        }

        if (enrollment.status !== 'PENDING') {
            throw new BadRequestException('Enrollment already accepted or completed');
        }

        await this.prisma.enrollment.update({
            where: { id: enrollmentIdNum },
            data: {
            status: 'ACTIVE',
            },
        });

        return `Enrollment ${enrollmentId} accepted successfully`;
    }

    async dropFromCourse(enrollmentId: string): Promise<string> {
        const enrollmentIdNum = parseInt(enrollmentId, 10);

        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentIdNum },
        });

        if (!enrollment) {
            throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
        }

        await this.prisma.enrollment.delete({
            where: { id: enrollmentIdNum },
        });

        return `Successfully dropped enrollment ${enrollmentId}`;
    }


}
