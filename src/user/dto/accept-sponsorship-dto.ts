import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";

export class AcceptSponsorshipDto {

    @ApiProperty()
    @IsInt()
    @Min(1)
    sponsorshipId: number;
}
