// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGymRegistry {
    function isApproved(address gymAddress) external view returns (bool);
}
