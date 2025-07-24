# 📚 Go 语言学习笔记

> 这是一个完整的 Go 语言学习笔记，包含详细的代码示例和图表说明。

## 📋 目录

- [概述](#概述)
- [变量声明](#变量声明)
- [常量 & 常量计数器（iota）](#常量--常量计数器iota)
- [import导包](#import导包)
- [指针](#指针)
- [defer 关键字](#defer-关键字)
- [slice](#slice)

---

## 概述

### go语言优势
- 强大的标准库
	- runtime系统调度机制
	- GC垃圾回收
	- 丰富的标准库
- 简单易学
	- 25个关键字
	- 内嵌支持C语法
	- 面向对象特征（封装、继承、多态）
	- 跨平台

### go语言不足
- 包管理：使用的大部份三方库都托管在github上；

## 变量声明

常用的四种变量声明方式：

```go
// 变量声明
var a int      // 一：声明一个变量，类型为int，默认值为0
var b int = 20 // 二：声明一个变量，类型为int，初始值为20
var c = 30     // 三：声明一个变量，自动推断类型
d := 40        // 四：声明一个变量，类型为int，初始值为40

var aa, bb, cc int = 1, 2, 5 // 声明多个变量，类型为int
var dd, ee, ff = 1, "2", 5   // 声明多个变量，自动推断类型

fmt.Printf("a: %T, b: %T, c: %T, d: %T\n", a, b, c, d) //打印变量类型
fmt.Println("a: ", a, "b: ", b, "c: ", c, "d: ", d)
fmt.Println("aa: ", aa, "bb: ", bb, "cc: ", cc)
fmt.Println("dd: ", dd, "ee: ", ee, "ff: ", ff)
```

> **注意**: 方法四只能在函数体内声明变量

## 常量 & 常量计数器（iota）

```go
const (
	CAT   = iota //iota关键字是常量计数器，从0开始，每行递增1
	DOG          //1
	MOUSE        //2
)

const (
	a, b = iota + 1, iota + 2 //1,2
	c, d = iota * 2, iota * 3 //4,5
	e, f                      //6,7
)
```

## import导包

- import时会执行对应包的init函数

![Go初始化流程](Notes/pictures/goinit.jpg)

- 在Go语言中，使用go.mod时，导入路径应该使用**模块名**作为前缀，而不是绝对路径

```go
package main

import (
	"gostudy1/lib1"
	"gostudy1/lib2"
)

func main() {
	lib1.Test()
	lib2.Test()
}
```

```go
package lib1

import "fmt"

func Test() {
	fmt.Println("lib1 Test")
}

func init() {
	fmt.Println("lib1 init")
}
```

```go
package lib2

import "fmt"

func Test() {
	fmt.Println("lib2 Test")
}

func init() {
	fmt.Println("lib2 init")
}
```

以上代码运行后输出：

```
lib1 init //import时执行
lib2 init // import时执行
lib1 Test
lib2 Test
```

> **重要**: 函数名首字母大写即表示该函数是public，可以在外部访问；函数名首字母时小写，只能在本package内访问；

### 匿名import

```go
import (
	_ "gostudy1/lib1"
	"gostudy1/lib2"
)
```

匿名导入lib1，不使用lib1的方法，但会执行lib1的init（）

## 指针

```go
func changeValue(p *int) {
	*p = 100
}
func main() {
	var a int = 10
	changeValue(&a)
}
```

## defer 关键字

### defer执行顺序
先写的defer先入栈，后写的后入栈；调用时出栈；因此先写的defer后被调用；

### defer和return的顺序
return先执行，defer后执行:

```go
func deferfunc() int {
	defer fmt.Println("defer func called")
	return 0
}

func returnfunc() int {
	defer fmt.Println("return func called")
	return 0
}

func test() int {
	defer deferfunc()
	return returnfunc()
}

func main() {
	test()
}
```

结果是：

```
return func called
defer func called
```

## slice

定义一个切片：

```go
// 定义一个长度为10的数组
slice := []int{1, 2, 3}
// 定义一个slice,未初始化
slice2 := make([]int, 3)
```

判断数组是不是为空：

```go
//判断一个slice是否为空
if slice2 == nil {
	fmt.Println("slice is nil")
}
```

**重要概念:**
- `len()`: 数组首尾指针之间的长度
- `cap()`: 数组预分配的容量

```go
// 声明一个int切片，长度为3，容量为4:len = 3,cap = 4
numbers := make([]int, 3, 4)
numbers = append(numbers, 1)
// 触发动态扩容，len = 5，cap = 8，cap新增的数量和之前的cap一致
numbers = append(numbers, 3)

// len = 0,cap = 0
var sliceTest []int
// len = 1,cap = 1
sliceTest = append(sliceTest, 1)
// len = 2,cap = 2
sliceTest = append(sliceTest, 2)
```

---

## 🎯 学习要点

### 核心概念
- **变量声明**: 四种方式，灵活使用
- **常量iota**: 自动递增计数器
- **包管理**: import机制和init函数
- **指针操作**: 内存地址和值传递
- **defer机制**: 延迟执行和栈操作
- **切片操作**: 动态数组和容量管理

### 最佳实践
- 合理使用变量声明方式
- 理解defer的执行顺序
- 掌握slice的扩容机制
- 注意包导入的init函数执行

---

> 📖 **完整笔记**: [查看原始Markdown文件](Notes/golang.md) 