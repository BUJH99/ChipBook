/* [MODULE_INFO_START]
 * Module: UartTx
 * Purpose: 8N1 UART transmitter. P_CLOCKS_PER_BIT >= 2.
 * Contract: iValid/oReady captures one byte. Output idles high, data LSB first.
 * [MODULE_INFO_END] */
module UartTx #(parameter int P_CLOCKS_PER_BIT = 16) (
    input logic iClk, input logic iRstn,
    input logic iValid, input logic [7:0] iData,
    output logic oReady, output logic oTx
);
    localparam int LP_COUNT_WIDTH = $clog2(P_CLOCKS_PER_BIT);
    logic [9:0] Frame;
    logic [3:0] BitCount;
    logic [LP_COUNT_WIDTH-1:0] Cnt;
    assign oReady = BitCount == 0;
    assign oTx = oReady ? 1'b1 : Frame[0];
    always_ff @(posedge iClk or negedge iRstn) begin
        if (!iRstn) begin
            Frame <= '1; BitCount <= '0; Cnt <= '0;
        end else if (oReady) begin
            if (iValid) begin
                Frame <= {1'b1,iData,1'b0};
                BitCount <= 4'd10;
                Cnt <= '0;
            end
        end else if (int'(Cnt) == P_CLOCKS_PER_BIT-1) begin
            Frame <= {1'b1,Frame[9:1]};
            BitCount <= BitCount - 1'b1;
            Cnt <= '0;
        end else Cnt <= Cnt + 1'b1;
    end
endmodule
