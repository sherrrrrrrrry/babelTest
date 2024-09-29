function tokenizeCode(code) {
    const tokens = [];    // 结果数组
    for (let i = 0; i < code.length; i++) {
        // 从0开始，一个字符一个字符地读取
        let currentChar = code.charAt(i);

        if (currentChar === ';') {
            // 对于这种只有一个字符的语法单元，直接加到结果当中
            tokens.push({
                type: 'sep',
                value: ';',
            });
            // 该字符已经得到解析，不需要做后续判断，直接开始下一个
            continue;
        }

        if (currentChar === '(' || currentChar === ')') {
            // 与 ; 类似只是语法单元类型不同
            tokens.push({
                type: 'parens',
                value: currentChar,
            });
            continue;
        }

        if (currentChar === '}' || currentChar === '{') {
            // 与 ; 类似只是语法单元类型不同
            tokens.push({
                type: 'brace',
                value: currentChar,
            });
            continue;
        }

        if (currentChar === '>' || currentChar === '<') {
            // 与 ; 类似只是语法单元类型不同
            tokens.push({
                type: 'operator',
                value: currentChar,
            });
            continue;
        }

        if (currentChar === '"' || currentChar === '\'') {
            // 引号表示一个字符传的开始
            const token = {
                type: 'string',
                value: currentChar,       // 记录这个语法单元目前的内容
            };
            tokens.push(token);

            const closer = currentChar;
            let escaped = false;        // 表示下一个字符是不是被转译的

            // 进行嵌套循环遍历，寻找字符串结尾
            for (i++; i < code.length; i++) {
                currentChar = code.charAt(i);
                // 先将当前遍历到的字符无条件加到字符串的内容当中
                token.value += currentChar;
                if (escaped) {
                    // 如果当前转译状态是true，就将改为false，然后就不特殊处理这个字符
                    escaped = false;
                } else if (currentChar === '\\') {
                    // 如果当前字符是 \ ，将转译状态设为true，下一个字符不会被特殊处理
                    escaped = true;
                } else if (currentChar === closer) {
                    break;
                }
            }
            continue;
        }

        if (/[0-9]/.test(currentChar)) {
            // 数字是以0到9的字符开始的
            const token = {
                type: 'number',
                value: currentChar,
            };
            tokens.push(token);

            for (i++; i < code.length; i++) {
                currentChar = code.charAt(i);
                if (/[0-9\.]/.test(currentChar)) {
                    // 如果遍历到的字符还是数字的一部分（0到9或小数点）
                    // 这里暂不考虑会出现多个小数点以及其他进制的情况
                    token.value += currentChar;
                } else {
                    // 遇到不是数字的字符就退出，需要把 i 往回调，
                    // 因为当前的字符并不属于数字的一部分，需要做后续解析
                    i--;
                    break;
                }
            }
            continue;
        }

        if (/[a-zA-Z\$\_]/.test(currentChar)) {
            // 标识符是以字母、$、_开始的
            const token = {
                type: 'identifier',
                value: currentChar,
            };
            tokens.push(token);

            // 与数字同理
            for (i++; i < code.length; i++) {
                currentChar = code.charAt(i);
                if (/[a-zA-Z0-9\$\_]/.test(currentChar)) {
                    token.value += currentChar;
                } else {
                    i--;
                    break;
                }
            }
            continue;
        }

        if (/\s/.test(currentChar)) {
            // 连续的空白字符组合到一起
            const token = {
                type: 'whitespace',
                value: currentChar,
            };
            tokens.push(token);

            // 与数字同理
            for (i++; i < code.length; i++) {
                currentChar = code.charAt(i);
                if (/\s]/.test(currentChar)) {
                    token.value += currentChar;
                } else {
                    i--;
                    break;
                }
            }
            continue;
        }

        // 还可以有更多的判断来解析其他类型的语法单元

        // 遇到其他情况就抛出异常表示无法理解遇到的字符
        throw new Error('Unexpected ' + currentChar);
    }
    return tokens;
}

const tokens = tokenizeCode(`
  if (1 > 0) {
    alert("if 1 > 0");
  }
  `);

/* 最后结果
[
  { type: "whitespace", value: "\n" },
  { type: "identifier", value: "if" },
  { type: "whitespace", value: " " },
  { type: "parens", value: "(" },
  { type: "number", value: "1" },
  { type: "whitespace", value: " " },
  { type: "operator", value: ">" },
  { type: "whitespace", value: " " },
  { type: "number", value: "0" },
  { type: "parens", value: ")" },
  { type: "whitespace", value: " " },
  { type: "brace", value: "{" },
  { type: "whitespace", value: "\n " },
  { type: "identifier", value: "alert" },
  { type: "parens", value: "(" },
  { type: "string", value: "\"if 1 > 0\"" },
  { type: "parens", value: ")" },
  { type: "sep", value: ";" },
  { type: "whitespace", value: "\n" },
  { type: "brace", value: "}" },
  { type: "whitespace", value: "\n" },
 ]
*/
