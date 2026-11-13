/* [MODULE_INFO_START]
 * Module: StreamDma
 * Purpose: one-byte ready/valid transfer controller; accepted-byte accounting.
 * Contract: iLength>0. iErr aborts. Start accepted only while idle.
 * Note: address generation and AXI channel adapters are separate layers.
 * [MODULE_INFO_END] */
module StreamDma (
    input logic iClk, input logic iRstn,
    input logic iStart, input logic [15:0] iLength, input logic iErr,
    input logic iValid, input logic [7:0] iData, output logic oReady,
    output logic oValid, output logic [7:0] oData, input logic iReady,
    output logic oBusy, output logic oDone, output logic oErr,
    output logic [15:0] oAccepted
);
    logic [15:0] Remaining;
    assign oValid = oBusy && iValid && !iErr;
    assign oReady = oBusy && iReady && !iErr;
    assign oData = iData;
    always_ff @(posedge iClk or negedge iRstn) begin
        if (!iRstn) begin
            oBusy<=1'b0; oDone<=1'b0; oErr<=1'b0; oAccepted<='0; Remaining<='0;
        end else begin
            oDone<=1'b0;
            if (!oBusy && iStart) begin
                oAccepted<='0; Remaining<=iLength; oErr<=iLength==0;
                oBusy<=iLength!=0; oDone<=iLength==0;
            end else if (oBusy) begin
                if (iErr) begin oBusy<=1'b0; oErr<=1'b1; oDone<=1'b1; end
                else if (oValid && iReady) begin
                    Remaining<=Remaining-1'b1; oAccepted<=oAccepted+1'b1;
                    if (Remaining==1) begin oBusy<=1'b0; oDone<=1'b1; end
                end
            end
        end
    end
endmodule
