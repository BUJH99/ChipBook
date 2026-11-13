/* [MODULE_INFO_START]
 * Module: ReadyValidFifo
 * Purpose: single-clock FIFO with stable output under backpressure.
 * Contract: P_DEPTH >= 2; reset discards queued data. No fall-through path.
 * [MODULE_INFO_END] */
module ReadyValidFifo #(
    parameter int P_WIDTH = 8,
    parameter int P_DEPTH = 4
) (
    input logic iClk, input logic iRstn,
    input logic iValid, input logic [P_WIDTH-1:0] iData,
    output logic oReady,
    output logic oValid, output logic [P_WIDTH-1:0] oData,
    input logic iReady,
    output logic [$clog2(P_DEPTH+1)-1:0] oCount
);
    localparam int LP_PTR_WIDTH = $clog2(P_DEPTH);
    logic [P_WIDTH-1:0] MemData [P_DEPTH];
    logic [LP_PTR_WIDTH-1:0] PtrWr, PtrRd;
    logic Push, Pop;
    assign oValid = oCount != 0;
    assign oReady = (int'(oCount) < P_DEPTH) || (oValid && iReady);
    assign oData = MemData[PtrRd];
    assign Push = iValid && oReady;
    assign Pop = oValid && iReady;
    always_ff @(posedge iClk or negedge iRstn) begin
        if (!iRstn) begin
            PtrWr <= '0; PtrRd <= '0; oCount <= '0;
        end else begin
            if (Push) begin
                MemData[PtrWr] <= iData;
                PtrWr <= int'(PtrWr) == P_DEPTH-1 ? '0 : PtrWr + 1'b1;
            end
            if (Pop) PtrRd <= int'(PtrRd) == P_DEPTH-1 ? '0 : PtrRd + 1'b1;
            unique case ({Push,Pop})
                2'b10: oCount <= oCount + 1'b1;
                2'b01: oCount <= oCount - 1'b1;
                default: oCount <= oCount;
            endcase
        end
    end
endmodule
