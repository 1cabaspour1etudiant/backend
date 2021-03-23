import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export abstract class PaginationDto {
    @ApiProperty()
    @IsOptional()
    @IsInt()
    @Min(0)
    @Transform(({ value }) => parseInt(value))
    page: number = 0;

    @ApiProperty()
    @IsOptional()
    @Min(1)
    @Max(20)
    @Transform(({ value }) => parseInt(value))
    pageSize: number = 20;
}
