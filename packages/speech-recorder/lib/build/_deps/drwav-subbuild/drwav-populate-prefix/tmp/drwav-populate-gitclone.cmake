# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file Copyright.txt or https://cmake.org/licensing for details.

cmake_minimum_required(VERSION 3.5)

if(EXISTS "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp/drwav-populate-gitclone-lastrun.txt" AND EXISTS "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp/drwav-populate-gitinfo.txt" AND
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp/drwav-populate-gitclone-lastrun.txt" IS_NEWER_THAN "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp/drwav-populate-gitinfo.txt")
  message(STATUS
    "Avoiding repeated git clone, stamp file is up to date: "
    "'/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp/drwav-populate-gitclone-lastrun.txt'"
  )
  return()
endif()

execute_process(
  COMMAND ${CMAKE_COMMAND} -E rm -rf "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-src"
  RESULT_VARIABLE error_code
)
if(error_code)
  message(FATAL_ERROR "Failed to remove directory: '/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-src'")
endif()

# try the clone 3 times in case there is an odd git clone issue
set(error_code 1)
set(number_of_tries 0)
while(error_code AND number_of_tries LESS 3)
  execute_process(
    COMMAND "/usr/bin/git" 
            clone --no-checkout --config "advice.detachedHead=false" "https://github.com/mackron/dr_libs" "drwav-src"
    WORKING_DIRECTORY "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps"
    RESULT_VARIABLE error_code
  )
  math(EXPR number_of_tries "${number_of_tries} + 1")
endwhile()
if(number_of_tries GREATER 1)
  message(STATUS "Had to git clone more than once: ${number_of_tries} times.")
endif()
if(error_code)
  message(FATAL_ERROR "Failed to clone repository: 'https://github.com/mackron/dr_libs'")
endif()

execute_process(
  COMMAND "/usr/bin/git" 
          checkout "9497270f581f43e6b795ce5d98d8764861fb6a50" --
  WORKING_DIRECTORY "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-src"
  RESULT_VARIABLE error_code
)
if(error_code)
  message(FATAL_ERROR "Failed to checkout tag: '9497270f581f43e6b795ce5d98d8764861fb6a50'")
endif()

set(init_submodules TRUE)
if(init_submodules)
  execute_process(
    COMMAND "/usr/bin/git" 
            submodule update --recursive --init 
    WORKING_DIRECTORY "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-src"
    RESULT_VARIABLE error_code
  )
endif()
if(error_code)
  message(FATAL_ERROR "Failed to update submodules in: '/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-src'")
endif()

# Complete success, update the script-last-run stamp file:
#
execute_process(
  COMMAND ${CMAKE_COMMAND} -E copy "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp/drwav-populate-gitinfo.txt" "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp/drwav-populate-gitclone-lastrun.txt"
  RESULT_VARIABLE error_code
)
if(error_code)
  message(FATAL_ERROR "Failed to copy script-last-run stamp file: '/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp/drwav-populate-gitclone-lastrun.txt'")
endif()
