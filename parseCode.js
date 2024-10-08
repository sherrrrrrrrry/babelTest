function parse(tokens) {
    let i = -1;     // 用于标识当前遍历位置
    let curToken;   // 用于记录当前符号

    // 读取下一个语句
    function nextStatement() {
        // 暂存当前的i，如果无法找到符合条件的情况会需要回到这里
        stash();

        // 读取下一个符号
        nextToken();

        if (curToken.type === 'identifier' && curToken.value === 'if') {
            // 解析 if 语句
            const statement = {
                type: 'IfStatement',
            };
            // if 后面必须紧跟着 (
            nextToken();
            if (curToken.type !== 'parens' || curToken.value !== '(') {
                throw new Error('Expected ( after if');
            }

            // 后续的一个表达式是 if 的判断条件
            statement.test = nextExpression();

            // 判断条件之后必须是 )
            nextToken();
            if (curToken.type !== 'parens' || curToken.value !== ')') {
                throw new Error('Expected ) after if test expression');
            }

            // 下一个语句是 if 成立时执行的语句
            statement.consequent = nextStatement();

            // 如果下一个符号是 else 就说明还存在 if 不成立时的逻辑
            if (curToken === 'identifier' && curToken.value === 'else') {
                statement.alternative = nextStatement();
            } else {
                statement.alternative = null;
            }
            commit();
            return statement;
        }

        if (curToken.type === 'brace' && curToken.value === '{') {
            // 以 { 开头表示是个代码块，我们暂不考虑JSON语法的存在
            const statement = {
                type: 'BlockStatement',
                body: [],
            };
            while (i < tokens.length) {
                // 检查下一个符号是不是 }
                stash();
                nextToken();
                if (curToken.type === 'brace' && curToken.value === '}') {
                    // } 表示代码块的结尾
                    commit();
                    break;
                }
                // 还原到原来的位置，并将解析的下一个语句加到body
                rewind();
                statement.body.push(nextStatement());
            }
            // 代码块语句解析完毕，返回结果
            commit();
            return statement;
        }

        // 没有找到特别的语句标志，回到语句开头
        rewind();

        // 尝试解析单表达式语句
        const statement = {
            type: 'ExpressionStatement',
            expression: nextExpression(),
        };
        if (statement.expression) {
            nextToken();
            if (curToken.type !== 'EOF' && curToken.type !== 'sep') {
                throw new Error('Missing ; at end of expression');
            }
            return statement;
        }
    }

    // 读取下一个表达式
    function nextExpression() {
        nextToken();

        if (curToken.type === 'identifier') {
            const identifier = {
                type: 'Identifier',
                name: curToken.value,
            };
            stash();
            nextToken();
            if (curToken.type === 'parens' && curToken.value === '(') {
                // 如果一个标识符后面紧跟着 ( ，说明是个函数调用表达式
                const expr = {
                    type: 'CallExpression',
                    caller: identifier,
                    arguments: [],
                };

                stash();
                nextToken();
                if (curToken.type === 'parens' && curToken.value === ')') {
                    // 如果下一个符合直接就是 ) ，说明没有参数
                    commit();
                } else {
                    // 读取函数调用参数
                    rewind();
                    while (i < tokens.length) {
                        // 将下一个表达式加到arguments当中
                        expr.arguments.push(nextExpression());
                        nextToken();
                        // 遇到 ) 结束
                        if (curToken.type === 'parens' && curToken.value === ')') {
                            break;
                        }
                        // 参数间必须以 , 相间隔
                        if (curToken.type !== 'comma' && curToken.value !== ',') {
                            throw new Error('Expected , between arguments');
                        }
                    }
                }
                commit();
                return expr;
            }
            rewind();
            return identifier;
        }

        if (curToken.type === 'number' || curToken.type === 'string') {
            // 数字或字符串，说明此处是个常量表达式
            const literal = {
                type: 'Literal',
                value: eval(curToken.value),
            };
            // 但如果下一个符号是运算符，那么这就是个双元运算表达式
            // 此处暂不考虑多个运算衔接，或者有变量存在
            stash();
            nextToken();
            if (curToken.type === 'operator') {
                commit();
                return {
                    type: 'BinaryExpression',
                    left: literal,
                    right: nextExpression(),
                };
            }
            rewind();
            return literal;
        }

        if (curToken.type !== 'EOF') {
            throw new Error('Unexpected token ' + curToken.value);
        }
    }

    // 往后移动读取指针，自动跳过空白
    function nextToken() {
        do {
            i++;
            curToken = tokens[i] || { type: 'EOF' };
        } while (curToken.type === 'whitespace');
    }

    // 位置暂存栈，用于支持很多时候需要返回到某个之前的位置
    const stashStack = [];

    function stash(cb) {
        // 暂存当前位置
        stashStack.push(i);
    }

    function rewind() {
        // 解析失败，回到上一个暂存的位置
        i = stashStack.pop();
        curToken = tokens[i];
    }

    function commit() {
        // 解析成功，不需要再返回
        stashStack.pop();
    }

    const ast = {
        type: 'Program',
        body: [],
    };

    // 逐条解析顶层语句
    while (i < tokens.length) {
        const statement = nextStatement();
        if (!statement) {
            break;
        }
        ast.body.push(statement);
    }
    return ast;
}

const ast = parse([
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
]);

/* 最后结果
{
  "type": "Program",
  "body": [
    {
      "type": "IfStatement",
      "test": {
        "type": "BinaryExpression",
        "left": {
          "type": "Literal",
          "value": 1
        },
        "right": {
          "type": "Literal",
          "value": 0
        }
      },
      "consequent": {
        "type": "BlockStatement",
        "body": [
          {
            "type": "ExpressionStatement",
            "expression": {
              "type": "CallExpression",
              "caller": {
                "type": "Identifier",
                "value": "alert"
              },
              "arguments": [
                {
                  "type": "Literal",
                  "value": "if 1 > 0"
                }
              ]
            }
          }
        ]
      },
      "alternative": null
    }
  ]
}
*/
