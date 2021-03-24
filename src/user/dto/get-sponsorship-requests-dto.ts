import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";
import { PaginationDto } from "./abstract-pagination-dto";

export class GetSponsorshipRequestsDto extends PaginationDto {
    @ApiProperty()
    @IsString()
    @IsIn(['received', 'sent'])
    type: string = 'received';
}
