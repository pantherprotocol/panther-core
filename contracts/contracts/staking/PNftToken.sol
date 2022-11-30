// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./pNftToken/NativeMetaTransaction.sol";
import "./pNftToken/ContentMixin.sol";
import "../common/ImmutableOwnable.sol";
import "./interfaces/INftGrantor.sol";

/**
 * @title PNftToken
 * @notice Panther NFT (PNFT) token on Polygon.
 * @dev If called by the "minter", it mints and grants one NFT to the address
 * given. The `AdvancedStakeRewardController` is supposed to be the minter and
 * call it to reward stakers with $PNFTs.
 * An immutable "owner" may update the minter and set the metadata (URIs) once.
 * Inspired and borrowed by/from the OpenSea's ERC721Tradable contract.
 * https://github.com/ProjectOpenSea/opensea-creatures/blob/master/contracts/ERC721Tradable.sol
 */
contract PNftToken is
    ImmutableOwnable,
    ERC721,
    ContextMixin,
    NativeMetaTransaction,
    INftGrantor
{
    using Counters for Counters.Counter;

    /**
     * We rely on the OZ Counter util to keep track of the next available ID.
     * We track the nextTokenId instead of the currentTokenId to save users on gas costs.
     */
    Counters.Counter private _nextTokenId;

    /// @notice Operator (or user's Proxy Register) approved for all transactions
    address public approvedForAll;
    address public minter;

    string public contractURI;
    string public baseTokenURI;

    event MinterUpdated(address _minter);
    event TokenUriUpdated(string _tokenURI);
    event ContractUriUpdated(string _contractURI);
    event ApprovedForAllUpdated(address approvee);

    constructor(
        address _owner,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) ImmutableOwnable(_owner) {
        // nextTokenId is initialized to 1, since starting at 0 leads to higher gas cost for the first minter
        _nextTokenId.increment();
        _initializeEIP712(_name);
    }

    /**
     * @dev Returns the total tokens minted so far.
     * 1 is always subtracted from the Counter since it tracks the next available tokenId.
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId.current() - 1;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        return
            string(abi.encodePacked(baseTokenURI, Strings.toString(_tokenId)));
    }

    /**
     * @dev Sets the minter address
     * @param _minter The address that can mint token
     */
    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Zero address");
        minter = _minter;

        emit MinterUpdated(_minter);
    }

    /**
     * @dev Sets the URI of the contract. it can be called
     * only once by the owner
     * @param _contractURI URI of the contract
     */
    function setContractURI(string calldata _contractURI) external onlyOwner {
        require(!(bytes(contractURI).length > 0), "Contract URI is defined");

        contractURI = _contractURI;

        emit ContractUriUpdated(_contractURI);
    }

    /**
     * @dev Sets the URI of the token. it can be called
     * only once by the owner
     * @param _baseTokenURI URI of the token
     */
    function setBaseTokenURI(string calldata _baseTokenURI) external onlyOwner {
        require(!(bytes(baseTokenURI).length > 0), "Base URI is defined");

        baseTokenURI = _baseTokenURI;

        emit TokenUriUpdated(_baseTokenURI);
    }

    /**
     * @dev Sets the address of the "operator" approved for all transactions.
     * May be set by the owner only.
     * @param approvee Approved address. It may be a Panther's contract or
     * OpenSea's ERC721 Proxy Registry, which is at
     * matic:0x58807baD0B376efc12F5AD86aAc70E78ed67deaE
     * (mumbai:0xff7Ca10aF37178BdD056628eF42fD7F799fAc77c)
     */
    function setApprovedForAllOperator(address approvee) external onlyOwner {
        // Zero address allowed (meaning "no account is set")
        approvedForAll = approvee;
        emit ApprovedForAllUpdated(approvee);
    }

    /**
     * @dev Mints a token to an address with a tokenURI.
     * @param _to address of the future owner of the token
     */
    function grantOneToken(address _to)
        external
        virtual
        returns (uint256 currentTokenId)
    {
        require(_msgSender() == minter, "Only minter");

        currentTokenId = _nextTokenId.current();
        _nextTokenId.increment();
        _safeMint(_to, currentTokenId);
    }

    /**
     * Override isApprovedForAll to whitelist a Panther authorized account or
     * user's OpenSea proxy accounts to enable gas-less transactions/listings.
     */
    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool)
    {
        if (super.isApprovedForAll(owner, operator)) return true;

        // if "approved for all" operator (proxy registry) is detected, return true
        address approvee = approvedForAll;
        return (approvee != address(0)) && (approvee == operator);
    }

    /**
     * This is used instead of msg.sender as transactions might be sent by a relayer rather than by a user directly.
     */
    function _msgSender() internal view override returns (address sender) {
        return ContextMixin.msgSender();
    }
}
