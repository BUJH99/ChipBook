/* [MODULE_INFO_START]
 * Module: SpiByte
 * Purpose: mode-0 SPI controller, MSB first, one system clock per half SCLK.
 * Contract: target MISO must meet iClk sampling timing; start ignored while busy.
 * [MODULE_INFO_END] */
module SpiByte (
    input logic iClk, input logic iRstn, input logic iStart,
    input logic [7:0] iData, input logic iMiso,
    output logic oSclk, output logic oCsn, output logic oMosi,
    output logic [7:0] oData, output logic oDone
);
    logic [7:0] TxShift, RxShift;
    logic [3:0] BitCount;
    assign oMosi = TxShift[7];
    always_ff @(posedge iClk or negedge iRstn) begin
        if (!iRstn) begin
            TxShift <= '0; RxShift <= '0; BitCount <= '0;
            oSclk <= 1'b0; oCsn <= 1'b1; oData <= '0; oDone <= 1'b0;
        end else begin
            oDone <= 1'b0;
            if (oCsn) begin
                if (iStart) begin
                    oCsn <= 1'b0; oSclk <= 1'b0;
                    TxShift <= iData; BitCount <= 4'd8;
                end
            end else if (!oSclk) begin
                oSclk <= 1'b1;
                RxShift <= {RxShift[6:0],iMiso};
            end else begin
                oSclk <= 1'b0;
                TxShift <= {TxShift[6:0],1'b0};
                BitCount <= BitCount - 1'b1;
                if (BitCount == 1) begin
                    oData <= RxShift; oDone <= 1'b1; oCsn <= 1'b1;
                end
            end
        end
    end
endmodule
