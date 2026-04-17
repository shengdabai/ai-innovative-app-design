import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationDto {
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(Order)
  order?: Order = Order.DESC;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }

  get take(): number {
    return this.limit ?? 20;
  }
}

export class IdDto {
  @IsString()
  id: string;
}

export class ResponseDto<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;

  static success<T>(data?: T, message?: string): ResponseDto<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(error: string, message?: string): ResponseDto {
    return {
      success: false,
      message,
      error,
    };
  }
}

export class PaginatedResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  static create<T>(
    data: T[],
    total: number,
    pagination: PaginationDto,
  ): PaginatedResponseDto<T> {
    const totalPages = Math.ceil(total / pagination.take);
    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  }
}
