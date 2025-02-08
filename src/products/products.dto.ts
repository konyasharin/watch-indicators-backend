import { IsArray, IsNumber, IsString } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Product, ProductDependency } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty({
    required: false,
    type: () => [Number],
  })
  @IsArray()
  dependencies?: ProductDependency['dependencyId'][];

  @ApiProperty({
    required: false,
    type: () => [Number],
  })
  @IsArray()
  dependents?: ProductDependency['dependentId'][];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
