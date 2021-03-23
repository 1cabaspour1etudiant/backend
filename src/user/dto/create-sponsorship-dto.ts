import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateSponsorShipDto {
    @ApiProperty()
    @IsInt()
    @Min(0)
    godfatherId: number;

    @ApiProperty()
    @IsInt()
    @Min(0)
    godsonId: number;
}
