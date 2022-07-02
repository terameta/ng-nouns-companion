# Angular Nouns Module Companion Extension 

![ngn Icon](https://raw.githubusercontent.com/terameta/ng-nouns-companion/main/src/assets/ng-nouns-companion.png 'ng-nouns')

Angular Nouns is an icon module for Angular projects and aimed at the developers and development teams lacking a designer to create icons for them. This companion extension is created to make the flow complete for the developers.

## Features

Companion module allows you to choose icons from the amazing https://thenounproject.com and add the svg icons as typescript exports in a single file.

When used together with the Angular Nouns module <coming soon> it will provide access to the whole repository of icons to the developers with a couple of clicks.

## Requirements

Recommended to be used together with the Angular Nouns module, but it is not a requirement.  
The companion can be effectively be used with probably any compatible icon module utilizing TypeScript.

## Extension Settings

Settings are required to be saved to the ng-nouns.json file at the root of the repository.  
Currently there is only one setting, iconFile:  

'''
{
	"iconFile": "/locationOfTheFileFromRootToSaveTheSVGs/icons.ts"
}
'''

## Known Issues

I have never tested the extension with multi-root workspaces.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ng-nouns-companion

