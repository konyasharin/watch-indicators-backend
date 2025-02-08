import { Injectable } from '@nestjs/common';
import { ProductDependency } from '@prisma/client';

export interface PinnedDependencies {
  dependent: ProductDependency['dependentId'];
  dependencies: ProductDependency['dependencyId'][];
}

@Injectable()
export class ProductsHelper {
  pinDependencies(
    dependenciesInfo: PinnedDependencies,
  ): Pick<ProductDependency, 'dependencyId' | 'dependentId'>[] {
    return dependenciesInfo.dependencies.map((dependency) => ({
      dependentId: dependenciesInfo.dependent,
      dependencyId: dependency,
    }));
  }
}
