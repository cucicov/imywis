### Tasks and potential problems
- Nodes are updated in cascade also when a connection is not directly or indirectly affected. A non-related node triggers the updates of all other nodes. To investigate if it could become a potential performance problem with multiple nodes. Point of interest: **nodeUtils.syncNodeDataFromSource**




### Sample images url
- https://www.ephotozine.com/resize/articles/22672/Laku.jpg?RTUdGk5cXyJFCgsJVANtdxU+cVRdHxFYFw1Gewk0T1JYFEtzen5YdgthHHsvEVxR
- https://www.ephotozine.com/resize/articles/22672/I_See_You.jpg?RTUdGk5cXyJFCgsJVANtdxU+cVRdHxFYFw1Gewk0T1JYFEtzen5YdgthHHsvEVxR
- https://www.ephotozine.com/resize/articles/22672/Lollycat.jpg?RTUdGk5cXyJFCgsJVANtdxU+cVRdHxFYFw1Gewk0T1JYFEtzen5YdgthHHsvEVxR
- cursor: https://blob.gifcities.org/gifcities/2CEGEQDTBN7R4YYOD436RPUZCQQHZVZO.gif


**RULES**
1. input fields of nodes must have the id name in the format of "field-{fieldName}" where fieldName is the exact name of the field in the type specified in NodeTypes.
