import luckysheetConfigsetting from '../controllers/luckysheetConfigsetting';
import Store from '../store';

export const error = {
  v: "#VALUE!", // Incorrect parameter or operator
  n: "#NAME?", // Formula name error
  na: "#N/A", // No available value in function or formula
  r: "#REF!", // Cell referenced by other formulas was deleted
  d: "#DIV/0!", // Divisor is 0 or empty cell
  nm: "#NUM!", // Problem with a number in formula or function
  nl: "#NULL!", // Incorrect use of intersection operator (space)
  sp: "#SPILL!", // Array range has other values
};

//是否是空值
function isRealNull(val) {
    if(val == null || val.toString().replace(/\s/g, "") == ""){
        return true;
    }
    else{
        return false;
    }
}

//是否是纯数字
function isRealNum(val) {
    if(val == null || val.toString().replace(/\s/g, "") === ""){
        return false;
    }

    if(typeof val == "boolean"){
        return false;
    }

    if(!isNaN(val)){
        return true;
    }
    else{
        return false;
    }
}

//是否是错误类型
function valueIsError(value) {
    let isError = false;

    for(let x in error){
        if(value == error[x]){
            isError = true;
            break;
        }
    }

    return isError;
}

//是否有中文
function hasChinaword(s) {
    let patrn = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;
    
    if (!patrn.exec(s)) {
        return false;
    }
    else {
        return true;
    }
}

//是否为非编辑模式
function isEditMode() {
    if(luckysheetConfigsetting.editMode){
        return true;
    }
    else{
        return false;
    }
}

/**
 * @description: 检查是否允许前台进行表格编辑
 * @param {*}
 * @return {Boolean} true:允许编辑 fasle:不允许
 */
function checkIsAllowEdit(){
    if (Store.allowEdit) {
        return true;
    }
    else {
        return false;
    }
}

//Whether the range only contains part of the merged cells
function hasPartMC(cfg, r1, r2, c1, c2) {
    let hasPartMC = false;

    for(let x in Store.config["merge"]){
        let mc = cfg["merge"][x];

        if(r1 < mc.r){
            if(r2 >= mc.r && r2 < (mc.r + mc.rs - 1)){
                if(c1 >= mc.c && c1 <= (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c2 >= mc.c && c2 <= (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c1 < mc.c && c2 > (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
            }
            else if(r2 >= mc.r && r2 == (mc.r + mc.rs - 1)){
                if(c1 > mc.c && c1 < (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c2 > mc.c && c2 < (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c1 == mc.c && c2 < (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c1 > mc.c && c2 == (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
            }
            else if(r2 > (mc.r + mc.rs - 1)){
                if(c1 > mc.c && c1 <= (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c2 >= mc.c && c2 < (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c1 == mc.c && c2 < (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c1 > mc.c && c2 == (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
            }
        }
        else if(r1 == mc.r){
            if(r2 < (mc.r + mc.rs - 1)){
                if(c1 >= mc.c && c1 <= (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c2 >= mc.c && c2 <= (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c1 < mc.c && c2 > (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
            }
            else if(r2 >= (mc.r + mc.rs - 1)){
                if(c1 > mc.c && c1 <= (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c2 >= mc.c && c2 < (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c1 == mc.c && c2 < (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
                else if(c1 > mc.c && c2 == (mc.c + mc.cs - 1)){
                    hasPartMC = true;
                    break;
                }
            }
        }
        else if(r1 <= (mc.r + mc.rs - 1)){
            if(c1 >= mc.c && c1 <= (mc.c + mc.cs - 1)){
                hasPartMC = true;
                break;
            }
            else if(c2 >= mc.c && c2 <= (mc.c + mc.cs - 1)){
                hasPartMC = true;
                break;
            }
            else if(c1 < mc.c && c2 > (mc.c + mc.cs - 1)){
                hasPartMC = true;
                break;
            }
        }
    }

    return hasPartMC;
}

//获取单个字符的字节数
function checkWordByteLength(value) {
    return Math.ceil(value.charCodeAt().toString(2).length / 8);
 }
 

export {
    isRealNull,
    isRealNum,
    valueIsError,
    hasChinaword,
    isEditMode,
    checkIsAllowEdit,
    hasPartMC,
    checkWordByteLength
}