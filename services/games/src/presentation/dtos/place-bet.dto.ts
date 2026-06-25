import { ApiProperty } from "@nestjs/swagger";
import { Matches } from "class-validator";

export class PlaceBetDto {
  @ApiProperty({
    description: "Bet amount in decimal reais (1.00 to 1000.00)",
    example: "10.00",
  })

  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: "amount must be a positive decimal with up to 2 places",
  })
  amount!: string;
}
