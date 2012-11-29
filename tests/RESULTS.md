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

#### Section 6
* ch11/11.6/11.6.1/S11.6.1_A2.2_T2.js
	* This is a legitimate bug, but since it only affects exact mode, I'm ignoring it for now

#### Section 8
* ch11/11.8/11.8.6/S11.8.6_A6_T3.js
	* This bug is tricky cause it relates to object prototypes and the recusrive referencing issue. The seemingly obvious fix would break other tests.

#### Section 13
* ch11/11.13/11.13.1/11.13.1-4-1.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js
* ch11/11.13/11.13.1/11.13.1-4-27-s.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js
* ch11/11.13/11.13.1/11.13.1-4-28-s.js
	* I have no idea what this test is doing. It starts by throwing an error, even though the code it wants to test is after the throw
* ch11/11.13/11.13.1/11.13.1-4-29-s.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js
* ch11/11.13/11.13.1/11.13.1-4-3-s.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js

### Chapter 12

#### Section 2
* ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-12-s.js
* ch12/12.2/12.2.1/12.2.1-13-s.js
* ch12/12.2/12.2.1/12.2.1-14-s.js
* ch12/12.2/12.2.1/12.2.1-18-s.js
* ch12/12.2/12.2.1/12.2.1-2-s.js
* ch12/12.2/12.2.1/12.2.1-23-s.js
* ch12/12.2/12.2.1/12.2.1-22-s.js
* ch12/12.2/12.2.1/12.2.1-24-s.js
* ch12/12.2/12.2.1/12.2.1-25-s.js
* ch12/12.2/12.2.1/12.2.1-26-s.js
* ch12/12.2/12.2.1/12.2.1-27-s.js
* ch12/12.2/12.2.1/12.2.1-28-s.js
* ch12/12.2/12.2.1/12.2.1-29-s.js
* ch12/12.2/12.2.1/12.2.1-30-s.js
* ch12/12.2/12.2.1/12.2.1-3-s.js
* ch12/12.2/12.2.1/12.2.1-31-s.js
* ch12/12.2/12.2.1/12.2.1-32-s.js
* ch12/12.2/12.2.1/12.2.1-33-s.js
* ch12/12.2/12.2.1/12.2.1-34-s.js
* ch12/12.2/12.2.1/12.2.1-35-s.js
* ch12/12.2/12.2.1/12.2.1-36-s.js
* ch12/12.2/12.2.1/12.2.1-37-s.js
* ch12/12.2/12.2.1/12.2.1-7-s.js

#### Section 6
* ch12/12.6/12.6.1/S12.6.1_A4_T2.js
* ch12/12.6/12.6.1/S12.6.1_A4_T3.js
* ch12/12.6/12.6.1/S12.6.1_A4_T4.js
* ch12/12.6/12.6.1/S12.6.1_A5.js
* ch12/12.6/12.6.2/S12.6.2_A4_T2.js
* ch12/12.6/12.6.2/S12.6.2_A4_T3.js
* ch12/12.6/12.6.2/S12.6.2_A4_T4.js
* ch12/12.6/12.6.2/S12.6.2_A5.js
* ch12/12.6/12.6.4/S12.6.4_A3.1.js
* ch12/12.6/12.6.4/S12.6.4_A3.js
* ch12/12.6/12.6.4/S12.6.4_A4.1.js
* ch12/12.6/12.6.4/S12.6.4_A4.js
* ch12/12.6/12.6.4/S12.6.4_A6.1.js
* ch12/12.6/12.6.4/S12.6.4_A6.js
* ch12/12.6/12.6.4/S12.6.4_A7_T1.js
* ch12/12.6/12.6.4/S12.6.4_A7_T2.js

#### Section 7
* ch12/12.7/S12.7_A6.js
* ch12/12.7/S12.7_A7.js

#### Section 8
* ch12/12.8/S12.8_A6.js
* ch12/12.8/S12.8_A7.js

#### Section 10
* ch12/12.10/12.10-7-1.js
* ch12/12.10/S12.10_A1.10_T1.js
* ch12/12.10/S12.10_A1.10_T3.js
* ch12/12.10/S12.10_A1.10_T2.js
* ch12/12.10/S12.10_A1.10_T4.js
* ch12/12.10/S12.10_A1.10_T5.js
* ch12/12.10/S12.10_A1.12_T5.js
* ch12/12.10/S12.10_A1.1_T1.js
* ch12/12.10/S12.10_A1.12_T4.js
* ch12/12.10/S12.10_A1.1_T2.js
* ch12/12.10/S12.10_A1.1_T3.js
* ch12/12.10/S12.10_A1.2_T4.js
* ch12/12.10/S12.10_A1.2_T5.js
* ch12/12.10/S12.10_A1.3_T4.js
* ch12/12.10/S12.10_A1.3_T5.js
* ch12/12.10/S12.10_A1.4_T2.js
* ch12/12.10/S12.10_A1.4_T5.js
* ch12/12.10/S12.10_A1.4_T3.js
* ch12/12.10/S12.10_A1.4_T1.js
* ch12/12.10/S12.10_A1.4_T4.js
* ch12/12.10/S12.10_A1.5_T2.js
* ch12/12.10/S12.10_A1.5_T1.js
* ch12/12.10/S12.10_A1.5_T4.js
* ch12/12.10/S12.10_A1.5_T5.js
* ch12/12.10/S12.10_A1.5_T3.js
* ch12/12.10/S12.10_A1.6_T2.js
* ch12/12.10/S12.10_A1.6_T1.js
* ch12/12.10/S12.10_A1.6_T3.js
* ch12/12.10/S12.10_A1.7_T5.js
* ch12/12.10/S12.10_A1.7_T4.js
* ch12/12.10/S12.10_A1.8_T4.js
* ch12/12.10/S12.10_A1.8_T5.js
* ch12/12.10/S12.10_A3.10_T2.js
* ch12/12.10/S12.10_A3.10_T3.js
* ch12/12.10/S12.10_A1.9_T2.js
* ch12/12.10/S12.10_A1.9_T3.js
* ch12/12.10/S12.10_A1.9_T1.js
* ch12/12.10/S12.10_A3.12_T4.js
* ch12/12.10/S12.10_A3.12_T5.js
* ch12/12.10/S12.10_A3.1_T2.js
* ch12/12.10/S12.10_A3.1_T3.js
* ch12/12.10/S12.10_A3.2_T4.js
* ch12/12.10/S12.10_A3.2_T5.js
* ch12/12.10/S12.10_A3.3_T4.js
* ch12/12.10/S12.10_A3.4_T2.js
* ch12/12.10/S12.10_A3.4_T3.js
* ch12/12.10/S12.10_A3.5_T2.js
* ch12/12.10/S12.10_A3.5_T3.js
* ch12/12.10/S12.10_A3.6_T2.js
* ch12/12.10/S12.10_A3.6_T3.js
* ch12/12.10/S12.10_A3.7_T4.js
* ch12/12.10/S12.10_A3.7_T5.js
* ch12/12.10/S12.10_A3.8_T4.js
* ch12/12.10/S12.10_A3.8_T5.js
* ch12/12.10/12.10.1/12.10.1-1-s.js
* ch12/12.10/12.10.1/12.10.1-14-s.js
* ch12/12.10/12.10.1/12.10.1-15-s.js
* ch12/12.10/12.10.1/12.10.1-16-s.js
* ch12/12.10/12.10.1/12.10.1-2-s.js
* ch12/12.10/12.10.1/12.10.1-3-s.js
* ch12/12.10/12.10.1/12.10.1-4-s.js
* ch12/12.10/12.10.1/12.10.1-7-s.js
* ch12/12.10/12.10.1/12.10.1-8-s.js
* ch12/12.10/12.10.1/12.10.1-9-s.js

#### Section 11
* ch12/12.11/S12.11_A1_T2.js
* ch12/12.11/S12.11_A1_T4.js
* ch12/12.11/S12.11_A2_T1.js

#### Section 12
* ch12/12.12/S12.12_A1_T1.js

#### Section 13
* ch12/12.13/S12.13_A1.js

#### Section 14
* ch12/12.14/S12.14_A12_T3.js
* ch12/12.14/S12.14_A13_T2.js
* ch12/12.14/S12.14_A13_T3.js
* ch12/12.14/S12.14_A17.js
* ch12/12.14/S12.14_A7_T2.js
* ch12/12.14/S12.14_A7_T3.js
* ch12/12.14/12.14.1/12.14.1-1-s.js
* ch12/12.14/12.14.1/12.14.1-2-s.js
* ch12/12.14/12.14.1/12.14.1-3-s.js

### Chapter 13

#### Section 0
* ch13/13.0/13.0-1.js
* ch13/13.0/13.0-16-s.js
* ch13/13.0/13.0-15-s.js
* ch13/13.0/13.0-2.js
* ch13/13.0/13.0-4.js
* ch13/13.0/13.0-3.js
* ch13/13.0/13.0-8-s.js
* ch13/13.0/13.0-7-s.js
* ch13/13.0/S13_A13_T3.js
* ch13/13.0/S13_A6_T2.js
* ch13/13.0/S13_A7_T2.js

#### Section 1
* ch13/13.1/13.1-10-s.js
* ch13/13.1/13.1-23-s.js
* ch13/13.1/13.1-24-s.js
* ch13/13.1/13.1-25-s.js
* ch13/13.1/13.1-26-s.js
* ch13/13.1/13.1-27-s.js
* ch13/13.1/13.1-28-s.js
* ch13/13.1/13.1-29-s.js
* ch13/13.1/13.1-3-7.js
* ch13/13.1/13.1-30-s.js
* ch13/13.1/13.1-31-s.js
* ch13/13.1/13.1-32-s.js
* ch13/13.1/13.1-33-s.js
* ch13/13.1/13.1-34-s.js
* ch13/13.1/13.1-40-s.js
* ch13/13.1/13.1-5-s.js
* ch13/13.1/13.1-6-s.js
* ch13/13.1/13.1-7-s.js
* ch13/13.1/13.1-8-s.js
* ch13/13.1/13.1-9-s.js

#### Section 2
* ch13/13.2/13.2-18-1.js
* ch13/13.2/S13.2.1_A5_T1.js
* ch13/13.2/S13.2.2_A17_T2.js
* ch13/13.2/S13.2.2_A19_T7.js

### Chapter 14

#### Section 0
* ch14/14.0/S14_A5_T2.js
* ch14/14.0/S14_A5_T1.js

#### Section 1
* ch14/14.1/14.1-14-s.js
* ch14/14.1/14.1-5-s.js
* ch14/14.1/14.1-4-s.js
* ch14/14.1/14.1-8-s.js

### Chapter 15
Not Analyzed