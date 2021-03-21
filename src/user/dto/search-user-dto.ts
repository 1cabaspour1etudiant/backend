import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, Max, Min, } from 'class-validator';


export class SearchUserDto {
    @ApiProperty()
    @IsOptional()
    @IsInt()
    @Min(0)
    page: number = 0;

    @ApiProperty()
    @IsOptional()
    @IsPositive()
    @Max(20)
    pageSize: number = 20;
}
