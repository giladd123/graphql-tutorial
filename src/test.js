function calculate(text) {
  let firstPlus = text.indexOf("+");
  let firstMinus = text.indexOf("-");
  if (checkIfTrue(firstPlus, firstMinus)) {
    let firstIndex = firstPlus - 1;
    while (firstIndex > -1 && !checkIfOperator(text[firstIndex])) {
      firstIndex--;
    }
    firstIndex++;
    let firstNum = text.substring(firstIndex, firstPlus);
    let secondIndex = firstPlus + 1;
    while (secondIndex < text.length && !checkIfOperator(text[secondIndex])) {
      secondIndex++;
    }
    let secondNum = text.substring(firstPlus + 1, secondIndex);
    let result = +firstNum + +secondNum;

    text = text.replace(`${firstNum}+${secondNum}`, `${result}`);
    return calculate(text);
  } else if (checkIfTrue(firstMinus, firstPlus)) {
    let firstIndex = firstMinus - 1;
    while (firstIndex > -1 && !checkIfOperator(text[firstIndex])) {
      firstIndex--;
    }
    firstIndex++;
    let firstNum = text.substring(firstIndex, firstMinus);
    let secondIndex = firstMinus + 1;
    while (secondIndex < text.length && !checkIfOperator(text[secondIndex])) {
      secondIndex++;
    }
    let secondNum = text.substring(firstMinus + 1, secondIndex);
    let result = +firstNum - +secondNum;

    text = text.replace(`${firstNum}-${secondNum}`, `${result}`);
    return calculate(text);
  } else {
    let firstMult = text.indexOf("*");
    let firstDiv = text.indexOf("/");
    if (checkIfTrue(firstMult, firstDiv)) {
      let firstIndex = firstMult - 1;
      while (firstIndex > -1 && !checkIfOperator(text[firstIndex])) {
        firstIndex--;
      }
      firstIndex++;
      let firstNum = text.substring(firstIndex, firstMult);
      let secondIndex = firstMult + 1;
      while (secondIndex < text.length && !checkIfOperator(text[secondIndex])) {
        secondIndex++;
      }
      let secondNum = text.substring(firstMult + 1, secondIndex);
      let result = +firstNum * +secondNum;

      text = text.replace(`${firstNum}*${secondNum}`, `${result}`);
      return calculate(text);
    } else if (checkIfTrue(firstDiv, firstMult)) {
      let firstIndex = firstDiv - 1;
      while (firstIndex > -1 && !checkIfOperator(text[firstIndex])) {
        firstIndex--;
      }
      firstIndex++;
      let firstNum = text.substring(firstIndex, firstDiv);
      let secondIndex = firstDiv + 1;
      while (secondIndex < text.length && !checkIfOperator(text[secondIndex])) {
        secondIndex++;
      }
      let secondNum = text.substring(firstDiv + 1, secondIndex);
      let result = +firstNum / +secondNum;

      text = text.replace(`${firstNum}/${secondNum}`, `${result}`);
      return calculate(text);
    } else {
      return text;
    }
  }
}
function checkIfOperator(char) {
  if (char == "+" || char == "-" || char == "*" || char == "/") {
    return true;
  }
  return false;
}
function checkIfTrue(first, second) {
  if (first == -1) return false;
  if (second == -1) {
    return true;
  }
  if (first < second) {
    return true;
  }
  return false;
}

console.log(calculate("2+4/2-1*5"));
