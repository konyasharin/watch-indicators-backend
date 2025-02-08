import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';
import { PinnedDependencies, ProductsHelper } from './products.helper';
import { Prisma, Product } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: ProductsHelper,
  ) {}

  async getAll() {
    const products = await this.prisma.product.findMany({
      include: {
        dependencies: {
          select: {
            id: true,
          },
        },
        dependents: {
          select: {
            id: true,
          },
        },
      },
    });
    return products.map((product) => ({
      ...product,
      dependencies: product.dependencies.map((dependency) => dependency.id),
      dependents: product.dependents.map((dependent) => dependent.id),
    }));
  }

  async create(dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      try {
        const promises: Promise<unknown>[] = [];
        const newProduct = await tx.product.create({
          data: {
            ...dto,
            dependencies: undefined,
            dependents: undefined,
          },
        });
        if (dto.dependencies) {
          promises.push(
            this.createDependencies(
              {
                dependent: newProduct.id,
                dependencies: dto.dependencies,
              },
              tx,
            ),
          );
        }
        if (dto.dependents) {
          dto.dependents.forEach((dependent) => {
            promises.push(
              this.createDependencies(
                {
                  dependent: dependent,
                  dependencies: [newProduct.id],
                },
                tx,
              ),
            );
          });
        }
        await Promise.all(promises);
        newProduct['dependencies'] = dto.dependencies;
        newProduct['dependents'] = dto.dependents;
      } catch (error) {
        throw new BadRequestException(error);
      }
    });
  }

  async update(id: Product['id'], dto: UpdateProductDto) {
    const promises: Promise<unknown>[] = [];
    const updatedProduct = await this.prisma.product.update({
      where: {
        id,
      },
      data: {
        ...dto,
        dependencies: undefined,
        dependents: undefined,
      },
    });
    if (dto.dependencies) {
      promises.push(
        this.updateDependencies({
          dependent: updatedProduct.id,
          dependencies: dto.dependencies,
        }),
      );
    }
    if (dto.dependents) {
      dto.dependents.forEach((dependent) => {
        promises.push(
          this.updateDependencies({
            dependent: dependent,
            dependencies: [updatedProduct.id],
          }),
        );
      });
    }
    await Promise.all(promises);
    updatedProduct['dependencies'] = dto.dependencies;
    updatedProduct['dependents'] = dto.dependents;

    return updatedProduct;
  }

  private async createDependencies(
    dependenciesInfo: PinnedDependencies,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    return prisma.productDependency.createMany({
      data: this.helper.pinDependencies(dependenciesInfo),
    });
  }

  private async updateDependencies(
    dependenciesInfo: PinnedDependencies,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    return prisma.productDependency.updateMany({
      data: this.helper.pinDependencies(dependenciesInfo),
      where: {
        id: dependenciesInfo.dependent,
      },
    });
  }
}
