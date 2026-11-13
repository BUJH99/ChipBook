/* [MODULE_INFO_START]
 * Module: ApbRegister
 * Purpose: APB4 register, 32-bit RW data and W1C event pending.
 * Contract: byte offsets 0x00=DATA, 0x04=STATUS. Event set wins over W1C clear.
 * Note: discrete ports retain compatibility with lightweight HDL simulators.
 * [MODULE_INFO_END] */
module ApbRegister (
    input logic iClk, input logic iRstn,
    input logic iPsel, input logic iPenable, input logic iPwrite,
    input logic [7:0] iPaddr, input logic [31:0] iPwdata, input logic [3:0] iPstrb,
    input logic iEvent,
    output logic [31:0] oPrdata, output logic oPready, output logic oPslverr,
    output logic [31:0] oData, output logic oIrq
);
    logic Transfer, Clear;
    assign Transfer = iPsel && iPenable;
    assign oPready = 1'b1;
    assign oPslverr = Transfer && iPaddr != 8'h00 && iPaddr != 8'h04;
    assign oPrdata = iPaddr == 8'h00 ? oData : iPaddr == 8'h04 ? {31'b0,oIrq} : 32'b0;
    assign Clear = Transfer && iPwrite && iPaddr == 8'h04 && iPstrb[0] && iPwdata[0];
    always_ff @(posedge iClk or negedge iRstn) begin
        if (!iRstn) begin oData <= '0; oIrq <= 1'b0; end
        else begin
            oIrq <= iEvent || (oIrq && !Clear);
            if (Transfer && iPwrite && iPaddr == 8'h00)
                for (int idxByte=0; idxByte<4; idxByte++)
                    if (iPstrb[idxByte]) oData[idxByte*8+:8] <= iPwdata[idxByte*8+:8];
        end
    end
endmodule
