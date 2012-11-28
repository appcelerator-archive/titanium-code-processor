Commentary on failed tests
----------------------

### Chapter 8
All tests passed

### Chapter 9
All tests passed

### Chapter 10

#### Section 1
* ch10/10.1/10.1.1/10.1.1-17-s.js
	* Technically a bug, but esoteric and fairly benign. Very difficult to find the source. Occurs in strict mode only, wrong type of exception is thrown.
* ch10/10.1/10.1.1/10.1.1-30-s.js
	* Basically the same bug as ch10/10.1/10.1.1/10.1.1-17-s.js

#### Section 4
* ch10/10.4/10.4.1/S10.4.1_A1_T2.js
	* Not exactly a bug, more something to consider. The Code Processor uses module scope, not global, but the test assumes global scope. Node.js fails this test too for the same reason

### Chapter 11

#### Section 1
* ch11/11.1/11.1.5/11.1.5_6-2-1-s.js
	* I think the test is wrong. The test references a variable instantiated inside the eval outside of the eval. From the spec: "10.4.2.1 Strict Mode Restrictions: The eval code cannot instantiate variable or function bindings in the variable environment of the calling context that invoked the eval if either the code of the calling context or the eval code is strict code. Instead such bindings are instantiated in a new VariableEnvironment that is only accessible to the eval code."
* ch11/11.1/11.1.5/11.1.5_6-2-2-s.js
	* This one is a matter of which exception takes priority. Technically both a Syntax Error and a Reference Error are valid. The Code Processor throws a reference error, but the test case says a Syntax Error should be thrown. The spec doesn't shed any light on how exception priority is handled. Since I'm not sure how to accuractly, according to the spec, resolve this issue, I'm leaving as is.
* ch11/11.1/11.1.5/11.1.5_7-2-1-s.js
	* Same issue as ch11/11.1/11.1.5/11.1.5_6-2-1-s.js
* ch11/11.1/11.1.5/11.1.5_7-2-2-s.js
	* Same issue as ch11/11.1/11.1.5/11.1.5_6-2-2-s.js

#### Section 2
* ch11/11.2/11.2.1/S11.2.1_A4_T1.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js
* ch11/11.2/11.2.1/S11.2.1_A4_T9.js
	* The failures in this test are from the compatibility (with ECMAScript 3) section of the spec (appendix B)

#### Section 4
* ch11/11.4/11.4.1/11.4.1-3-a-1-s.js
	* Same issue as ch11/11.1/11.1.5/11.1.5_6-2-1-s.js
* ch11/11.4/11.4.1/11.4.1-4.a-8-s.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js (I think)
* ch11/11.4/11.4.1/11.4.1-5-a-15-s.js
* ch11/11.4/11.4.1/11.4.1-5-a-28-s.js
* ch11/11.4/11.4.1/S11.4.1_A5.js
* ch11/11.4/11.4.3/S11.4.3_A3.6.js

#### Section 5
Not Analyzed

#### Section 6
Not Analyzed

#### Section 7
Not Analyzed

#### Section 8
Not Analyzed

#### Section 9
Not Analyzed

### Chapter 12
Not Analyzed

### Chapter 13
Not Analyzed

### Chapter 14
Not Analyzed

### Chapter 15
Not Analyzed